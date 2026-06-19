

## 1. Big picture: how the backend works

Our system is this:

```text
React frontend
   ↓ HTTP requests / fetch / axios
Node.js + Express backend
   ↓ Mongoose queries
MongoDB Atlas database
   ↓
users, listings, inquiries collections
```

The backend is the “gatekeeper.” React should not directly talk to MongoDB. React calls API routes like:

```text
POST /api/auth/register
POST /api/auth/login
GET /api/listings
POST /api/listings
POST /api/listings/:id/save
POST /api/inquiries/listings/:listingId
GET /api/admin/metrics
```

Our backend decides who is allowed to do what.

---

# 2. Libraries used and what each one does

## `express`

Express creates Our API server and routes.

Example:

```js
router.post("/login", async (req, res) => {
  // login logic
});
```

This means:

```text
POST http://localhost:5000/api/auth/login
```

will run that code.

## `mongoose`

Mongoose connects Our Node backend to MongoDB and gives we models like:

```js
User
Listing
Inquiry
```

Instead of writing raw MongoDB queries, we write:

```js
const user = await User.findOne({ email });
const listing = await Listing.create({...});
```

## `dotenv`

Loads secret values from `.env`.

Example:

```env
MONGODB_URI=...
JWT_SECRET=...
SMTP_PASS=...
```

Our code reads them using:

```js
process.env.MONGODB_URI
process.env.JWT_SECRET
process.env.SMTP_PASS
```

This keeps secrets out of Our code.

## `cors`

Allows Our React frontend to call Ourbackend.

Our frontend runs on:

```text
http://localhost:5173
```

Our backend runs on:

```text
http://localhost:5000
```

Browsers block cross-origin requests by default, so `cors` allows Our frontend origin.

## `bcryptjs`

Hashes passwords before storing them.

we never want to store this:

```text
Password1!
```

directly in MongoDB.

Instead, bcrypt stores something like:

```text
$2b$10$L7a....
```

Then on login, bcrypt compares the entered password against the hash.

## `jsonwebtoken`

Creates and verifies login tokens.

After login, backend returns a JWT:

```text
eyJhbGciOiJIUzI1NiIsInR5cCI6...
```

The frontend sends this token back on protected requests:

```http
Authorization: Bearer JWT_TOKEN_HERE
```

The backend checks that token using `JWT_SECRET`.

## Node built-in `crypto`

Used for email verification token generation.

We use it to create a random token:

```js
crypto.randomBytes(32).toString("hex")
```

Then we hash that token before storing it in MongoDB. This is safer than storing the raw verification link token.

## `nodemailer`

Nodemailer sends real emails from Our backend through SMTP. In Ourcase, we are using Gmail SMTP with a Gmail App Password. Nodemailer’s docs show that it creates a transporter and sends mail through providers like Gmail. ([Nodemailer](https://nodemailer.com/guides/using-gmail?utm_source=chatgpt.com "Using Gmail"))

## `swagger-ui-express`

Creates the Swagger page:

```text
http://localhost:5000/api-docs
```

This is similar to Swagger in .NET Web API. It lets we test routes from the browser.

## `nodemon`

Development tool. It restarts the backend automatically when files change.

```powershell
npm run dev
```

runs:

```text
nodemon server.js
```

---

# 3. `.env`: Our secret configuration file

Our `.env` contains runtime configuration.

Example:

```env
PORT=5000
CLIENT_URL=http://localhost:5173
FRONTEND_URL=http://localhost:5173
API_BASE_URL=http://localhost:5000

MONGODB_URI=mongodb+srv://...
JWT_SECRET=...
JWT_EXPIRES_IN=7d

SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=Ourgmail@gmail.com
SMTP_PASS=Ourgoogle_app_password
EMAIL_FROM="CampusCart <yoOurail@gmail.com>"
```

What each one means:

```text
PORT
```

The backend port.

```text
CLIENT_URL
```

The frontend URL allowed by CORS.

```text
FRONTEND_URL
```

Frontend app URL. Later we may redirect verified users there.

```text
API_BASE_URL
```

Backend URL used to build verification links.

```text
MONGODB_URI
```

MongoDB Atlas connection string.

```text
JWT_SECRET
```

Private signing key for JWT tokens.

```text
JWT_EXPIRES_IN
```

How long login tokens stay valid.

```text
SMTP_HOST / SMTP_PORT / SMTP_SECURE
```

Email server connection settings.

```text
SMTP_USER / SMTP_PASS
```

Our Gmail address and App Password.

```text
EMAIL_FROM
```

Sender shown in the verification email.

Important: Our `.env` must never be pushed to GitLab. Our`.gitignore` should include:

```gitignore
.env
node_modules
```

Our already pasted Our MongoDB password earlier, so rotate/change the MongoDB database password before final deployment or public repo work.

---

# 4. Gmail App Password: what it is

A Gmail App Password is **not Our normal Gmail password**. It is a separate 16-character password that lets an app like OurNode backend send emails through yoOurmail account. Google says App Passwords require 2-Step Verification on the Google Account. ([Google Help](https://support.google.com/mail/answer/185833?hl=en&utm_source=chatgpt.com "Sign in with app passwords - Gmail Help"))

Flow:

```text
Our backend
   ↓ uses SMTP_USER + SMTP_PASS
Gmail SMTP server
   ↓ sends email
User inbox receives verification email
```

For Gmail SMTP, Our `.env` should be:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=007.garry.earl@gmail.com
SMTP_PASS=Our_16_character_app_password
EMAIL_FROM="CampusCart <007.garry.earl@gmail.com>"
```

Because we are using Our personal Gmail, the email will likely appear as:

```text
CampusCart <007.garry.earl@gmail.com>
```

So yes, users may see Our Gmail address. Later, use a project Gmail or domain email.

---

# 5. `server.js`: the main backend entry point

This file starts everything.

It does these jobs:

```text
1. Load .env variables
2. Connect to MongoDB
3. Create Express app
4. Enable CORS
5. Enable JSON request bodies
6. Add health routes
7. Add Swagger route
8. Register API route groups
9. Start server on port 5000
```

Important parts:

```js
dotenv.config();
```

Loads `.env`.

```js
connectDB();
```

Connects to MongoDB Atlas.

```js
app.use(express.json());
```

Lets backend read JSON bodies like:

```json
{
  "email": "test@dal.ca",
  "password": "Password1!"
}
```

```js
app.use("/api/auth", require("./routes/authRoutes"));
```

Mounts auth routes.

So this:

```js
router.post("/login")
```

inside `authRoutes.js` becomes:

```text
POST /api/auth/login
```

Same pattern:

```js
app.use("/api/listings", require("./routes/listingRoutes"));
app.use("/api/inquiries", require("./routes/inquiryRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
```

---

# 6. `config/db.js`: MongoDB connection

This file connects Our backend to MongoDB Atlas.

Main logic:

```js
await mongoose.connect(process.env.MONGODB_URI);
```

If it works, we see:

```text
MongoDB connected: ...
```

If it fails, backend exits:

```js
process.exit(1);
```

That is good. If DB is not connected, the API should not keep running pretending everything is fine.

---

# 7. `models/User.js`: user database design

This file defines what a user document looks like in MongoDB.

A user has:

```text
name
email
password
role
isEmailVerified
emailVerificationToken
emailVerificationExpires
savedListings
isActive
createdAt
updatedAt
```

## Important fields

```js
email: {
  unique: true
}
```

Prevents duplicate email accounts.

```js
role: {
  enum: ["student", "admin"],
  default: "student"
}
```

Users are students by default.

```js
isEmailVerified: {
  type: Boolean,
  default: false
}
```

New users cannot login until they verify their email.

```js
savedListings: [
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Listing"
  }
]
```

This stores references to listings the user saved.

## Password validation

Our backend enforces:

```text
minimum 8 characters
at least 1 number
at least 1 symbol
```

This must be enforced on backend. Frontend can also enforce it for nicer user experience, but backend is the real security layer.

## Password hashing

This part runs before saving:

```js
userSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});
```

Meaning:

```text
User registers with Password1!
↓
Before saving, backend hashes it
↓
MongoDB stores hashed password only
```

## Password matching

```js
userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};
```

On login:

```text
User enters Password1!
↓
bcrypt compares Password1! against saved hash
↓
returns true or false
```

## Email verification token

```js
userSchema.methods.createEmailVerificationToken = function () {
  const rawToken = crypto.randomBytes(32).toString("hex");

  this.emailVerificationToken = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");

  this.emailVerificationExpires = Date.now() + 1000 * 60 * 60;

  return rawToken;
};
```

Important idea:

```text
Raw token goes in email link
Hashed token goes in database
```

So MongoDB does not store the actual clickable token.

---

# 8. `models/Listing.js`: product listing database design

This file defines listings.

A listing has:

```text
title
description
price
category
condition
imageUrls
seller
status
isFlagged
createdAt
updatedAt
```

## Seller reference

```js
seller: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User",
  required: true
}
```

Each listing belongs to a user.

Example:

```text
Listing: Used Calculus Textbook
Seller: User ObjectId("...")
```

## Status

```js
status: {
  enum: ["active", "sold", "removed"],
  default: "active"
}
```

When deleting a listing, we do **soft delete**:

```text
status = "removed"
```

The document stays in MongoDB, but public listing search hides it.

This is better than hard deleting because admin can still audit removed content.

---

# 9. `models/Inquiry.js`: buyer/seller message design

An inquiry has:

```text
listing
buyer
seller
message
status
createdAt
updatedAt
```

References:

```js
listing → Listing
buyer → User
seller → User
```

This lets we do:

```text
Buyer sends message about listing
Seller sees received inquiries
Buyer sees sent inquiries
```

---

# 10. `utils/sendEmail.js`: email sending

This file sends email using Nodemailer.

It checks required SMTP config first:

```js
const requiredEnvVars = [
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASS",
  "EMAIL_FROM"
];
```

Then creates a mail transporter:

```js
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});
```

Then sends:

```js
await transporter.sendMail({
  from,
  to,
  subject,
  text,
  html
});
```

Nodemailer’s SMTP transport is configured using host, port, secure, and auth settings, which is exactly what Our `.env` provides. ([Nodemailer](https://nodemailer.com/guides/using-gmail?utm_source=chatgpt.com "Using Gmail"))

---

# 11. `middleware/authMiddleware.js`: route protection

This file has two middleware functions:

```text
protect
adminOnly
```

## `protect`

Used on routes that require login.

Example:

```js
router.post("/", protect, async (req, res) => {
  // create listing
});
```

Flow:

```text
Request comes in
↓
Check Authorization header
↓
Extract Bearer token
↓
Verify JWT using JWT_SECRET
↓
Find user from DB
↓
Check user is active
↓
Check email is verified
↓
Attach user to req.user
↓
Continue to route
```

Header looks like:

```http
Authorization: Bearer eyJhbGciOiJIUzI1...
```

This line verifies the token:

```js
const decoded = jwt.verify(token, process.env.JWT_SECRET);
```

Then:

```js
req.user = user;
```

That means later routes can use:

```js
req.user._id
req.user.role
req.user.email
```

## `adminOnly`

Used after `protect`.

```js
router.use(protect);
router.use(adminOnly);
```

It allows only:

```js
req.user.role === "admin"
```

Otherwise:

```json
{
  "message": "Access denied. Admin only."
}
```

---

# 12. `routes/authRoutes.js`: register, verify email, login

This is the most important file.

## Register route

```text
POST /api/auth/register
```

User sends:

```json
{
  "name": "Garry Sangha",
  "email": "garry@example.com",
  "password": "Password1!"
}
```

Backend does:

```text
1. Validate password rule
2. Check if email already exists
3. Create user with role student
4. Hash password through User model pre-save hook
5. Create email verification token
6. Save hashed token in MongoDB
7. Build verification URL
8. Send email using Nodemailer
9. Return success message
```

Important professional decision:

```text
Public register does not accept role: "admin"
```

That prevents anyone from making themselves admin through Swagger.

## Email verification route

```text
GET /api/auth/verify-email/:token
```

User clicks link in email:

```text
http://localhost:5000/api/auth/verify-email/some-token
```

Backend does:

```text
1. Hash token from URL
2. Find user whose stored hashed token matches
3. Check token has not expired
4. Set isEmailVerified = true
5. Remove verification token fields
6. Show success HTML page
```

After this, user can login.

## Resend verification

```text
POST /api/auth/resend-verification
```

Body:

```json
{
  "email": "garry@example.com"
}
```

Backend:

```text
1. Finds user
2. If already verified, rejects
3. Creates new token
4. Sends new email
```

## Login route

```text
POST /api/auth/login
```

Body:

```json
{
  "email": "garry@example.com",
  "password": "Password1!"
}
```

Backend does:

```text
1. Find user by email
2. Check user exists and is active
3. Compare password with bcrypt
4. Check email is verified
5. Generate JWT token
6. Return token + user info
```

Response:

```json
{
  "message": "Login successful",
  "token": "...",
  "user": {
    "id": "...",
    "name": "Garry Sangha",
    "email": "garry@example.com",
    "role": "student",
    "isEmailVerified": true
  }
}
```

## `/me` route

```text
GET /api/auth/me
```

Requires token.

It returns the currently logged-in user.

---

# 13. `routes/listingRoutes.js`: listing CRUD

## Public browse

```text
GET /api/listings
```

Anyone can browse listings, even without login.

Supports query params:

```text
search
category
condition
sortBy
order
page
limit
```

Example:

```text
/api/listings?search=calculus&category=textbooks&condition=used
```

Backend builds a MongoDB filter:

```js
const filter = { status: "active" };
```

Then adds search/category/condition filters.

## Get one listing

```text
GET /api/listings/:id
```

Public route. Returns one listing if it exists and is not removed.

## Create listing

```text
POST /api/listings
```

Protected route.

Requires login token.

Backend uses:

```js
seller: req.user._id
```

This is important. The frontend does **not** send seller ID. The backend gets seller from the JWT-authenticated user.

## Update listing

```text
PUT /api/listings/:id
```

Protected route.

Allowed only if:

```text
user owns listing
OR user is admin
```

Check:

```js
const isOwner = listing.seller.toString() === req.user._id.toString();
const isAdmin = req.user.role === "admin";
```

## Delete listing

```text
DELETE /api/listings/:id
```

Soft delete:

```js
listing.status = "removed";
```

Not hard delete.

## My listings

```text
GET /api/listings/my/listings
```

Returns listings created by logged-in user.

## Saved listings

```text
POST /api/listings/:id/save
```

This toggles save/unsave.

If already saved:

```text
remove from savedListings
```

If not saved:

```text
add to savedListings
```

```text
GET /api/listings/saved/me
```

Returns saved listings for current user.

---

# 14. `routes/inquiryRoutes.js`: buyer messages

## Send inquiry

```text
POST /api/inquiries/listings/:listingId
```

Body:

```json
{
  "message": "Hi, is this textbook still available?"
}
```

Backend checks:

```text
1. Listing exists
2. Listing is active
3. Buyer is not seller
4. Create inquiry
```

This prevents a seller from sending inquiry to their own listing.

## Received inquiries

```text
GET /api/inquiries/received
```

Seller uses this to see messages from buyers.

## Sent inquiries

```text
GET /api/inquiries/sent
```

Buyer uses this to see messages they sent.

---

# 15. `routes/adminRoutes.js`: admin dashboard API

All routes here are protected by:

```js
router.use(protect);
router.use(adminOnly);
```

So the user must be:

```text
logged in
email verified
role = admin
```

## Get all users

```text
GET /api/admin/users
```

Returns all users without password.

## Deactivate user

```text
PATCH /api/admin/users/:id/deactivate
```

Sets:

```js
isActive = false
```

This is better than hard deleting because records remain for audit.

Also prevents admin from deactivating themselves.

## Get all listings

```text
GET /api/admin/listings
```

Admin can see active, removed, sold, flagged listings.

## Remove listing

```text
PATCH /api/admin/listings/:id/remove
```

Admin sets listing status to removed.

## Metrics

```text
GET /api/admin/metrics
```

Returns:

```text
totalUsers
activeUsers
verifiedUsers
totalListings
activeListings
removedListings
flaggedListings
totalInquiries
```

This supports Our admin dashboard.

---

# 16. `config/swagger.js`: API documentation

Swagger file describes Our API in OpenAPI format.

It defines:

```text
API title
server URL
security scheme
request schemas
routes
parameters
responses
```

Important part:

```js
securitySchemes: {
  bearerAuth: {
    type: "http",
    scheme: "bearer",
    bearerFormat: "JWT"
  }
}
```

This makes Swagger show the **Authorize** button.

For protected routes, Swagger knows they need JWT.

In Swagger:

```text
1. Login
2. Copy JWT token
3. Click Authorize
4. Paste token
5. Test protected routes
```

Usually with Swagger bearerAuth, paste the token value only. If it fails, paste:

```text
Bearer TOKEN_HERE
```

depending on Swagger UI behavior.

---

# 17. Database collections

Our MongoDB database is:

```text
campuscart
```

Collections:

```text
users
listings
inquiries
```

## `users`

Example document:

```json
{
  "_id": "...",
  "name": "Garry Sangha",
  "email": "garry@example.com",
  "password": "$2b$10$...",
  "role": "student",
  "isEmailVerified": true,
  "savedListings": [],
  "isActive": true
}
```

## `listings`

```json
{
  "_id": "...",
  "title": "Used Calculus Textbook",
  "description": "Good condition textbook.",
  "price": 35,
  "category": "textbooks",
  "condition": "used",
  "seller": "USER_OBJECT_ID",
  "status": "active"
}
```

## `inquiries`

```json
{
  "_id": "...",
  "listing": "LISTING_OBJECT_ID",
  "buyer": "USER_OBJECT_ID",
  "seller": "USER_OBJECT_ID",
  "message": "Is this still available?",
  "status": "new"
}
```

---

# 18. Full auth flow from frontend perspective

## Register

React sends:

```http
POST /api/auth/register
```

Backend creates user and sends email.

Frontend shows:

```text
Please check Our email to verify Ouraccount.
```

## Verify email

User opens email and clicks link.

Backend sets:

```js
isEmailVerified = true
```

## Login

React sends:

```http
POST /api/auth/login
```

Backend returns token.

Frontend stores token in localStorage or memory.

## Create listing

React sends:

```http
POST /api/listings
Authorization: Bearer token
```

Backend verifies token, gets user, creates listing.

## Admin routes

Only token from admin user can access:

```text
/api/admin/*
```

---

# 19. Password validation: backend vs frontend

Do it in both places.

## Backend

Mandatory.

This is real enforcement. Users can bypass frontend using Postman, Swagger, curl, or browser dev tools. Backend must reject weak passwords.

## Frontend

Optional but recommended.

It gives instant feedback:

```text
Password must be at least 8 characters, include a number, and include a symbol.
```

But frontend validation is only user experience, not security.

---

# 20. Current professional/security notes

we should fix these before final deployment:

1. **Rotate MongoDB password** because it was pasted in chat.

2. Replace `JWT_SECRET` with a long random value:

```powershell
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

3. Never commit `.env`.

4. Use a project Gmail later instead of personal Gmail.

5. Do not allow public users to choose `role: "admin"`.

6. Keep email verification URL out of the register response in final version.

7. Use deployed URLs later:

```env
CLIENT_URL=https://Our-frontend.vercel.app
FRONTEND_URL=https://Ourfrontend.vercel.app
API_BASE_URL=https://yoOurackend.onrender.com
```

8. Atlas Network Access should be restricted later instead of open to all IPs.

---

# 21. How to test everything

## 1. Start backend

```powershell
npm run dev
```

## 2. Open Swagger

```text
http://localhost:5000/api-docs
```

## 3. Register

```json
{
  "name": "Test User",
  "email": "real-email-we-can-open@gmail.com",
  "password": "Password1!"
}
```

## 4. Check email

Click verification link.

## 5. Login

```json
{
  "email": "real-email-we-can-open@gmail.com",
  "password": "Password1!"
}
```

Copy token.

## 6. Authorize in Swagger

Click **Authorize**.

Paste token.

## 7. Create listing

```json
{
  "title": "Used Calculus Textbook",
  "description": "Good condition textbook.",
  "price": 35,
  "category": "textbooks",
  "condition": "used",
  "imageUrls": ["https://example.com/book.jpg"]
}
```

## 8. Test save/inquiry/admin routes

Use a second verified user for buyer behavior. Use admin role only for admin dashboard testing.

---

The backend is now doing the important full-stack work: MongoDB stores data, Express exposes the API, JWT controls sessions, email verification controls account activation, and Swagger documents/tests the API.


