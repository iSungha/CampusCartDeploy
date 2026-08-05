const normalizeBoolean = (value, fallback) => {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  return String(value).toLowerCase() === "true";
};

const getRuntimeEnvironment = () => {
  const explicitEnvironment = String(
    process.env.DEPLOYMENT_ENV || process.env.RUNTIME_ENV || ""
  )
    .trim()
    .toLowerCase();

  if (["render", "production"].includes(explicitEnvironment)) {
    return "render";
  }

  if (["local", "localhost", "development"].includes(explicitEnvironment)) {
    return "local";
  }

  // Render automatically supplies RENDER=true and service metadata.
  if (
    process.env.RENDER === "true" ||
    process.env.RENDER_SERVICE_ID ||
    process.env.RENDER_EXTERNAL_HOSTNAME ||
    process.env.RENDER_SERVICE_NAME
  ) {
    return "render";
  }

  return "local";
};

const isRenderEnvironment = () => getRuntimeEnvironment() === "render";

const shouldAutoVerifyEmail = () => {
  if (!isRenderEnvironment()) {
    return false;
  }

  return normalizeBoolean(process.env.AUTO_VERIFY_EMAIL_ON_RENDER, true);
};

const getRuntimeInfo = () => ({
  environment: getRuntimeEnvironment(),
  emailVerificationMode: shouldAutoVerifyEmail()
    ? "automatic"
    : "verification-email"
});

module.exports = {
  getRuntimeEnvironment,
  getRuntimeInfo,
  isRenderEnvironment,
  shouldAutoVerifyEmail
};
