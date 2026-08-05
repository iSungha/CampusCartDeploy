# CampusCart Frontend

Merged React/Vite frontend for CampusCart.

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

## Included frontend integration

- AI product-description generation through `POST /api/ai/generate-description`
- Optional rough notes sent as the backend `notes` field
- Editable AI-generated description before listing creation or update
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
