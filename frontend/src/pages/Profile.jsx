import { useState } from "react";
import { KeyRound, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import api from "../api/api";
import Navbar from "../components/Navbar";
import SiteFooter from "../components/SiteFooter";
import { useAuth } from "../context/AuthContext";

const passwordRule =
  /^(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;

function roleLabel(role) {
  if (!role) return "Student";
  return role.charAt(0).toUpperCase() + role.slice(1);
}

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [saving, setSaving] = useState(false);

  function handlePasswordFieldChange(event) {
    const { name, value } = event.target;
    setPasswordForm((previous) => ({ ...previous, [name]: value }));
  }

  async function handlePasswordReset(event) {
    event.preventDefault();

    if (
      !passwordForm.currentPassword ||
      !passwordForm.newPassword ||
      !passwordForm.confirmNewPassword
    ) {
      toast.error("Fill in all three password fields.");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
      toast.error("New password and confirmation do not match.");
      return;
    }

    if (!passwordRule.test(passwordForm.newPassword)) {
      toast.error(
        "New password must be at least 8 characters and include a number and a symbol."
      );
      return;
    }

    try {
      setSaving(true);
      const response = await api.post("/auth/reset-password", {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      toast.success(response.data?.message || "Password reset successfully.");
      await logout();
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Reset password error:", error);
      toast.error(
        error.response?.data?.message || "Failed to reset your password."
      );
    } finally {
      setSaving(false);
    }
  }

  if (!user) {
    return (
      <>
        <Navbar />
        <main className="page-container">
          <p className="page-message">Loading your profile...</p>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />

      <main className="page-container profile-page">
        <h1 className="profile-heading">Profile &amp; Account Security</h1>

        <div className="profile-form">
          <section className="profile-card">
            <div className="profile-card-header">
              <div className="profile-avatar-icon">
                <User size={30} />
              </div>

              <div>
                <h2>{user.name}</h2>
                <p className="profile-email">{user.email}</p>
                <p className="profile-role">Role: {roleLabel(user.role)}</p>
              </div>
            </div>
          </section>

          <form className="profile-card" onSubmit={handlePasswordReset}>
            <div className="profile-card-header">
              <div className="profile-avatar-icon">
                <KeyRound size={28} />
              </div>
              <div>
                <h2>Reset password</h2>
                <p className="profile-email">
                  Resetting your password signs you out on every device.
                </p>
              </div>
            </div>

            <input
              className="standalone-input"
              type="password"
              name="currentPassword"
              placeholder="Current password"
              autoComplete="current-password"
              value={passwordForm.currentPassword}
              onChange={handlePasswordFieldChange}
            />

            <input
              className="standalone-input"
              type="password"
              name="newPassword"
              placeholder="New password"
              autoComplete="new-password"
              value={passwordForm.newPassword}
              onChange={handlePasswordFieldChange}
            />
            <small className="field-hint">
              At least 8 characters, including a number and a symbol.
            </small>

            <input
              className="standalone-input"
              type="password"
              name="confirmNewPassword"
              placeholder="Confirm new password"
              autoComplete="new-password"
              value={passwordForm.confirmNewPassword}
              onChange={handlePasswordFieldChange}
            />

            <button
              type="submit"
              className="profile-save-button"
              disabled={saving}
            >
              {saving ? "Resetting password..." : "Reset Password"}
            </button>
          </form>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
