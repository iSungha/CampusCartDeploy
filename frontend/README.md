# CampusCart Frontend

React/Vite frontend for CampusCart.

## API environments

The deployed Render API is the default:

```env
VITE_API_BASE_URL=https://campuscartapi.onrender.com/api
```

Run against the deployed API:

```bash
npm install
npm run dev
```

Run against the local backend at `http://localhost:5000/api`:

```bash
npm run dev:local
```

The local command loads `.env.local-api`. No source-code change is required when switching APIs.

## Registration behaviour

After registration, the frontend immediately signs the new user in with the same email and password and stores the returned JWT.

- On Render, accounts are automatically email-verified by the backend, so registration ends with the user logged in and redirected to the listings page.
- Locally, the backend sends a verification email. If the account is still unverified, the user is sent to Login after registration and can sign in after verifying the email.

## Listing image upload flow

Users now choose image files from their computer or phone instead of typing image URLs.

1. The frontend sends each selected file to:

```http
POST /api/uploads/listing-image
Content-Type: multipart/form-data
Form field: image
```

2. The backend uploads the file to Cloudinary and returns:

```json
{
  "image": {
    "url": "https://res.cloudinary.com/.../image/upload/...jpg"
  }
}
```

3. The frontend collects those returned Cloudinary URLs and creates or updates the listing with:

```json
{
  "imageUrls": [
    "https://res.cloudinary.com/.../image/upload/...jpg"
  ]
}
```

Supported files: JPG, PNG, and WEBP, maximum 5 MB each and up to 5 images per listing.

## Included frontend integration

- AI product-description generation through `POST /api/ai/generate-description`
- Optional rough notes sent as the backend `notes` field
- Editable AI-generated description before listing creation or update
- File-based Cloudinary image upload with previews and validation
- Automatic login after successful Render registration
- Admin dashboard link visible only to `role: "admin"`
- Admin-only route guard for `/admin`
- Admin metrics, listing moderation, and user deactivation
- Server-backed logout through `POST /api/auth/logout`
- Authenticated password reset through `POST /api/auth/reset-password`
- Netlify SPA redirects and security headers

## AI example

Use these listing values:

- Title: `Used Calculus Textbook`
- Category: `Textbooks`
- Condition: `Used`
- Price: `35`
- Quick notes: `Some highlighting`

Click **Generate AI Description**. The returned text is inserted into the product-description field and remains editable.

## Production build

```bash
npm run build
```

Local-API build for testing:

```bash
npm run build:local
```
