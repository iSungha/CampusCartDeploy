# CampusCart Authentication Patch

## Added endpoints

### POST `/api/auth/logout`

Requires `Authorization: Bearer <JWT>`.

The endpoint increments the user's `tokenVersion`, invalidating all existing
JWTs for that account. The frontend must also remove the token from local or
session storage.

### POST `/api/auth/reset-password`

Requires `Authorization: Bearer <JWT>`.

Body:

```json
{
  "currentPassword": "Password1!",
  "newPassword": "NewPassword2!"
}
```

The new password must contain at least eight characters, one number, and one
symbol. A successful reset invalidates all existing JWTs, so the frontend
should remove its token and return the user to the login page.

## Local versus Render email verification

The runtime is detected using Render's automatically supplied environment
variables. You can explicitly override detection with:

```env
DEPLOYMENT_ENV=local
```

or:

```env
DEPLOYMENT_ENV=render
```

Default behaviour:

- **Local:** registration creates a verification token and sends the existing
  SMTP verification email.
- **Render:** registration sets `isEmailVerified=true` automatically and does
  not attempt to send a verification email.
- Existing unverified accounts are also automatically verified after a valid
  login on Render.
- `/api/auth/resend-verification` sends an email locally, but directly verifies
  the account on Render.

To force verification emails on Render:

```env
AUTO_VERIFY_EMAIL_ON_RENDER=false
```

## Confirm the active mode

Open either:

- `GET /`
- `GET /api/health`

The response includes:

```json
{
  "environment": "local",
  "emailVerificationMode": "verification-email"
}
```

or:

```json
{
  "environment": "render",
  "emailVerificationMode": "automatic"
}
```
