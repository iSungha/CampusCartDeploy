const express = require("express");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");
const { protect } = require("../middleware/authMiddleware");
const {
  getRuntimeEnvironment,
  shouldAutoVerifyEmail
} = require("../utils/runtimeEnvironment");

const router = express.Router();

const passwordRule =
  /^(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();

const validatePassword = (password) => passwordRule.test(password || "");

const generateToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is missing from .env");
  }

  return jwt.sign(
    {
      id: user._id,
      tokenVersion: Number(user.tokenVersion || 0)
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d"
    }
  );
};

const buildVerificationEmail = (name, verificationUrl) => ({
  subject: "Verify your CampusCart email",
  text: `Hi ${name}, welcome to CampusCart. Please verify your email using this link: ${verificationUrl}. This link expires in 1 hour.`,
  html: `
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <h2>Welcome to CampusCart</h2>
      <p>Hi ${name},</p>
      <p>Please verify your email address to activate your CampusCart account.</p>
      <p>
        <a href="${verificationUrl}" target="_blank" style="display:inline-block;padding:10px 16px;background:#0f766e;color:#ffffff;text-decoration:none;border-radius:6px;">
          Verify Email
        </a>
      </p>
      <p>This verification link expires in 1 hour.</p>
      <p>If you did not create this account, you can ignore this email.</p>
    </div>
  `
});

const sendVerificationEmail = async (user) => {
  const rawVerificationToken = user.createEmailVerificationToken();
  await user.save();

  const apiBaseUrl = process.env.API_BASE_URL || "http://localhost:5000";
  const verificationUrl = `${apiBaseUrl}/api/auth/verify-email/${rawVerificationToken}`;
  const emailContent = buildVerificationEmail(user.name, verificationUrl);

  await sendEmail({
    to: user.email,
    subject: emailContent.subject,
    text: emailContent.text,
    html: emailContent.html
  });
};

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const email = normalizeEmail(req.body.email);
    const password = req.body.password;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email, and password are required"
      });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters long and include at least one number and one symbol"
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "User with this email already exists"
      });
    }

    const autoVerify = shouldAutoVerifyEmail();

    const user = await User.create({
      name,
      email,
      password,
      role: "student",
      isEmailVerified: autoVerify
    });

    if (autoVerify) {
      return res.status(201).json({
        message:
          "User registered successfully. Email was automatically verified on Render.",
        runtime: getRuntimeEnvironment(),
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isEmailVerified: user.isEmailVerified
        }
      });
    }

    await sendVerificationEmail(user);

    return res.status(201).json({
      message:
        "User registered successfully. Please check your email to verify your account.",
      runtime: getRuntimeEnvironment(),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified
      }
    });
  } catch (error) {
    return res.status(400).json({
      message: "Registration failed",
      error: error.message
    });
  }
});

// GET /api/auth/verify-email/:token
router.get("/verify-email/:token", async (req, res) => {
  try {
    const hashedToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).send(`
        <!doctype html>
        <html>
          <head><title>Email Verification Failed</title></head>
          <body style="font-family: Arial, sans-serif; padding: 40px;">
            <h2>Email verification failed</h2>
            <p>The verification link is invalid or has expired.</p>
          </body>
        </html>
      `);
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    return res.status(200).send(`
      <!doctype html>
      <html>
        <head><title>Email Verified</title></head>
        <body style="font-family: Arial, sans-serif; padding: 40px;">
          <h2>Email verified successfully</h2>
          <p>Your CampusCart account is now active. You can now log in.</p>
        </body>
      </html>
    `);
  } catch (error) {
    return res.status(500).send(`
      <!doctype html>
      <html>
        <head><title>Email Verification Error</title></head>
        <body style="font-family: Arial, sans-serif; padding: 40px;">
          <h2>Email verification error</h2>
          <p>Something went wrong while verifying your email.</p>
        </body>
      </html>
    `);
  }
});

// POST /api/auth/resend-verification
router.post("/resend-verification", async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        message: "Email is already verified"
      });
    }

    if (shouldAutoVerifyEmail()) {
      user.isEmailVerified = true;
      user.emailVerificationToken = undefined;
      user.emailVerificationExpires = undefined;
      await user.save();

      return res.status(200).json({
        message: "Email automatically verified because the API is running on Render.",
        runtime: getRuntimeEnvironment(),
        isEmailVerified: true
      });
    }

    await sendVerificationEmail(user);

    return res.status(200).json({
      message: "Verification email sent.",
      runtime: getRuntimeEnvironment()
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to resend verification email",
      error: error.message
    });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const password = req.body.password;
    const user = await User.findOne({ email });

    if (!user || !user.isActive) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    const passwordMatches = await user.matchPassword(password);

    if (!passwordMatches) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    // This also upgrades accounts created on Render before auto-verification
    // was added to the application.
    if (!user.isEmailVerified && shouldAutoVerifyEmail()) {
      user.isEmailVerified = true;
      user.emailVerificationToken = undefined;
      user.emailVerificationExpires = undefined;
      await user.save();
    }

    if (!user.isEmailVerified) {
      return res.status(403).json({
        message: "Please verify your email before logging in"
      });
    }

    return res.status(200).json({
      message: "Login successful",
      token: generateToken(user),
      runtime: getRuntimeEnvironment(),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified
      }
    });
  } catch (error) {
    return res.status(500).json({
      message: "Login failed",
      error: error.message
    });
  }
});

// POST /api/auth/logout
// CampusCart uses bearer JWTs. Incrementing tokenVersion invalidates every
// previously issued token for this user. The frontend must also delete its
// locally stored token after receiving this response.
router.post("/logout", protect, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { tokenVersion: 1 }
    });

    return res.status(200).json({
      message: "Logout successful. All existing login tokens were invalidated."
    });
  } catch (error) {
    return res.status(500).json({
      message: "Logout failed",
      error: error.message
    });
  }
});

// POST /api/auth/reset-password
// This is an authenticated password reset. It does not depend on email, so it
// works locally and on Render. The user must provide the current password.
router.post("/reset-password", protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: "Current password and new password are required"
      });
    }

    if (!validatePassword(newPassword)) {
      return res.status(400).json({
        message:
          "New password must be at least 8 characters long and include at least one number and one symbol"
      });
    }

    const user = await User.findById(req.user._id);

    if (!user || !user.isActive) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    const currentPasswordMatches = await user.matchPassword(currentPassword);

    if (!currentPasswordMatches) {
      return res.status(401).json({
        message: "Current password is incorrect"
      });
    }

    const reusesCurrentPassword = await user.matchPassword(newPassword);

    if (reusesCurrentPassword) {
      return res.status(400).json({
        message: "New password must be different from the current password"
      });
    }

    user.password = newPassword;
    user.tokenVersion = Number(user.tokenVersion || 0) + 1;
    await user.save();

    return res.status(200).json({
      message:
        "Password reset successfully. All existing login tokens were invalidated; please log in again."
    });
  } catch (error) {
    return res.status(500).json({
      message: "Password reset failed",
      error: error.message
    });
  }
});

// GET /api/auth/me
router.get("/me", protect, async (req, res) => {
  return res.status(200).json(req.user);
});

module.exports = router;
