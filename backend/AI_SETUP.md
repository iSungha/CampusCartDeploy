# CampusCart AI Description Generator Setup

## 1. Create the API key

Create a Gemini API key in Google AI Studio.

## 2. Configure the backend

Copy `.env.example` to `.env` if needed, then set:

```env
GEMINI_API_KEY=your_real_key_here
GEMINI_MODEL=gemini-3.5-flash-lite
```

Do not place the key in the React frontend and do not commit `.env`.

## 3. Start CampusCart

```powershell
npm install
npm run dev
```

## 4. Test in Swagger

1. Open `http://localhost:5000/api-docs`.
2. Register, verify the email, and log in.
3. Copy the JWT returned by login.
4. Click **Authorize** and enter the token.
5. Open `POST /api/ai/generate-description`.
6. Use this request:

```json
{
  "title": "Used Calculus Textbook",
  "category": "textbooks",
  "condition": "used",
  "price": 35,
  "notes": "Some highlighting"
}
```

The response contains an editable `description`. Its exact wording may vary.

## 5. Frontend integration

The backend feature is complete. The uploaded archive contained only the backend, so the React button is not directly added here. A ready-to-use frontend fetch example is included at the end of `readme.md`.
