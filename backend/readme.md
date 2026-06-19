# CampusCart Backend README

CampusCart is a campus buy-and-sell marketplace backend built with **Node.js**, **Express**, **MongoDB Atlas**, **Mongoose**, **JWT authentication**, **Gmail SMTP email verification**, **Cloudinary image storage**, and **Swagger API documentation**.

---

## 1. Big picture: how the backend works

The system works like this:

```text
React frontend
   ↓ HTTP requests / fetch / axios
Node.js + Express backend
   ↓ Mongoose queries
MongoDB Atlas database
   ↓
users, listings, inquiries collections

Cloudinary
   ↑
backend uploads listing images here
```

The backend is the gatekeeper. The React frontend should not directly talk to MongoDB or Cloudinary using private secrets. React calls backend routes like:

```text
POST /api/auth/register
POST /api/auth/login
GET /api/listings
POST /api/listings
POST /api/listings/:id/images
POST /api/listings/:id/save
POST /api/inquiries/listings/:listingId
GET /api/admin/metrics
```

The backend decides:

```text
who is logged in
who is verified
who owns a listing
who is admin
who can upload images
who can create/update/delete data
```

---

## 2. Current backend folder structure

```text
backend/
├── config/
│   ├── cloudinary.js
│   ├── db.js
│   └── swagger.js
├── middleware/
│   ├── authMiddleware.js
│   └── uploadMiddleware.js
├── models/
│   ├── Inquiry.js
│   ├── Listing.js
│   └── User.js
├── routes/
│   ├── adminRoutes.js
│   ├── authRoutes.js
│   ├── inquiryRoutes.js
│   ├── listingRoutes.js
│   └── uploadRoutes.js
├── utils/
│   ├── cloudinaryUpload.js
│   └── sendEmail.js
├── .env
├── .env.example
├── .gitignore
├── package.json
└── server.js
```

Important:

```text
.env should exist locally only
.env.example can be committed
node_modules should not be committed
```

---

## 3. Install packages

From inside the `backend/` folder:

```powershell
npm install express mongoose dotenv cors bcryptjs jsonwebtoken nodemailer swagger-ui-express cloudinary multer
npm install --save-dev nodemon
```

Run the backend:

```powershell
npm run dev
```

Open Swagger:

```text
http://localhost:5000/api-docs
```

---

## 4. Libraries used and what each one does

## `express`

Express creates the API server and routes.

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

will run that route.

## `mongoose`

Mongoose connects the Node backend to MongoDB and gives us models like:

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
CLOUDINARY_API_SECRET=...
```

The code reads them using:

```js
process.env.MONGODB_URI
process.env.JWT_SECRET
process.env.SMTP_PASS
process.env.CLOUDINARY_API_SECRET
```

This keeps secrets out of the source code.

## `cors`

Allows the React frontend to call the backend.

The frontend runs on:

```text
http://localhost:5173
```

The backend runs on:

```text
http://localhost:5000
```

Browsers block cross-origin requests by default, so `cors` allows the frontend origin.

## `bcryptjs`

Hashes passwords before storing them.

We never store this directly in MongoDB:

```text
Password1!
```

Instead, bcrypt stores something like:

```text
$2b$10$L7a....
```

On login, bcrypt compares the entered password against the saved hash.

## `jsonwebtoken`

Creates and verifies login tokens.

After login, the backend returns a JWT:

```text
eyJhbGciOiJIUzI1NiIsInR5cCI6...
```

The frontend sends this token back on protected requests:

```http
Authorization: Bearer JWT_TOKEN_HERE
```

The backend verifies that token using `JWT_SECRET`.

## Node built-in `crypto`

Used for email verification token generation.

We use it to create a random token:

```js
crypto.randomBytes(32).toString("hex")
```

Then we hash that token before storing it in MongoDB. This is safer than storing the raw verification token.

## `nodemailer`

Nodemailer sends real emails from the backend through SMTP.

In this project, we use Gmail SMTP with a Gmail App Password.

Flow:

```text
backend
   ↓ uses SMTP_USER + SMTP_PASS
Gmail SMTP server
   ↓ sends email
user inbox receives verification email
```

## `cloudinary`

Cloudinary stores uploaded listing images online.

Flow:

```text
frontend chooses image
   ↓ multipart/form-data
backend receives image
   ↓ Cloudinary API
Cloudinary stores image
   ↓ returns secure_url
backend saves secure_url in listing.imageUrls
```

## `multer`

Multer handles image uploads sent as `multipart/form-data`.

In this project, the upload form-data key must be:

```text
image
```

The backend temporarily keeps the uploaded file in memory, uploads it to Cloudinary, then saves the returned URL.

## `swagger-ui-express`

Creates the Swagger API documentation page:

```text
http://localhost:5000/api-docs
```

This is similar to Swagger in .NET Web API. It lets us test routes from the browser.

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

# 5. `.env`: secret configuration file

The `.env` file contains runtime configuration and secrets.

Example:

```env
PORT=5000
CLIENT_URL=http://localhost:5173
FRONTEND_URL=http://localhost:5173
API_BASE_URL=http://localhost:5000

MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@cluster0.xxxxx.mongodb.net/campuscart?appName=Cluster0

JWT_SECRET=replace_with_long_random_secret
JWT_EXPIRES_IN=7d

SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=yourgmail@gmail.com
SMTP_PASS=your_16_character_google_app_password
EMAIL_FROM="CampusCart <yourgmail@gmail.com>"

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
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

Backend URL used to build email verification links.

```text
MONGODB_URI
```

MongoDB Atlas connection string.

```text
JWT_SECRET
```

Private signing key for JWT login tokens.

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

Gmail address and Gmail App Password.

```text
EMAIL_FROM
```

Sender shown in the verification email.

```text
CLOUDINARY_CLOUD_NAME
```

Cloudinary cloud name.

```text
CLOUDINARY_API_KEY
```

Cloudinary API key.

```text
CLOUDINARY_API_SECRET
```

Cloudinary API secret. This must stay private.

Important:

```gitignore
.env
node_modules
```

The `.env` file must never be pushed to GitLab/GitHub.

---

# 6. Gmail App Password: what it is

A Gmail App Password is not the normal Gmail password. It is a separate 16-character password that lets an app like our Node backend send emails through a Gmail account.

For Gmail SMTP, `.env` should look like this:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=yourgmail@gmail.com
SMTP_PASS=your_16_character_app_password
EMAIL_FROM="CampusCart <yourgmail@gmail.com>"
```

Because the backend uses a Gmail account, the email may appear as:

```text
CampusCart <yourgmail@gmail.com>
```

For a class demo, this is fine. Later, use a project Gmail or a domain email.

---

# 7. Cloudinary image storage: what it does

Cloudinary stores listing images online.

Before Cloudinary, listings used image URLs like:

```json
"imageUrls": [
  "https://example.com/book.jpg"
]
```

Now, the app can upload real images and store Cloudinary URLs like:

```json
"imageUrls": [
  "https://res.cloudinary.com/your-cloud-name/image/upload/campuscart/listings/example.jpg"
]
```

The backend supports two image upload approaches:

## Option A: upload image first, then create listing

```text
POST /api/uploads/listing-image
```

This uploads the image to Cloudinary and returns the image URL.

Then the frontend sends that returned URL when creating a listing:

```text
POST /api/listings
```

with:

```json
{
  "title": "Used Calculus Textbook",
  "description": "Good condition textbook.",
  "price": 35,
  "category": "textbooks",
  "condition": "used",
  "imageUrls": ["https://res.cloudinary.com/..."]
}
```

## Option B: create listing first, then attach image

```text
POST /api/listings/:id/images
```

This uploads the image to Cloudinary and pushes the returned URL directly into that listing's `imageUrls` array.

This is useful when the listing already exists.

---

# 8. `server.js`: main backend entry point

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

Important route mounting:

```js
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/listings", require("./routes/listingRoutes"));
app.use("/api/inquiries", require("./routes/inquiryRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/uploads", require("./routes/uploadRoutes"));
```

This means:

```text
authRoutes.js       → /api/auth/*
listingRoutes.js    → /api/listings/*
inquiryRoutes.js    → /api/inquiries/*
adminRoutes.js      → /api/admin/*
uploadRoutes.js     → /api/uploads/*
```

---

# 9. `config/db.js`: MongoDB connection

This file connects the backend to MongoDB Atlas.

Main logic:

```js
await mongoose.connect(process.env.MONGODB_URI);
```

If it works, the backend logs:

```text
MongoDB connected: ...
```

If it fails, the backend exits:

```js
process.exit(1);
```

That is good. If the database is not connected, the API should not keep running pretending everything is fine.

---

# 10. `config/cloudinary.js`: Cloudinary configuration

This file connects the backend to Cloudinary.

```js
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

module.exports = cloudinary;
```

Important:

```text
CLOUDINARY_API_SECRET must only be used in the backend.
Do not put it in React.
Do not commit it.
```

---

# 11. `models/User.js`: user database design

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

The backend enforces:

```text
minimum 8 characters
at least 1 number
at least 1 symbol
```

Frontend can also enforce it for better user experience, but backend validation is the real security layer.

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

# 12. `models/Listing.js`: product listing database design

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

## Image URLs

```js
imageUrls: {
  type: [String],
  default: []
}
```

This stores image URLs.

Now those URLs usually come from Cloudinary:

```text
https://res.cloudinary.com/...
```

## Status

```js
status: {
  enum: ["active", "sold", "removed"],
  default: "active"
}
```

When deleting a listing, the backend does a soft delete:

```text
status = "removed"
```

The document stays in MongoDB, but public listing search hides it.

This is better than hard deleting because admin can still audit removed content.

---

# 13. `models/Inquiry.js`: buyer/seller message design

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

```text
listing → Listing
buyer → User
seller → User
```

This lets the app support:

```text
Buyer sends message about listing
Seller sees received inquiries
Buyer sees sent inquiries
```

---

# 14. `utils/sendEmail.js`: email sending

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
  from: process.env.EMAIL_FROM,
  to,
  subject,
  text,
  html
});
```

This is used during registration and resend verification.

---

# 15. `utils/cloudinaryUpload.js`: upload helper

This file uploads an image buffer to Cloudinary.

Main idea:

```text
req.file.buffer
   ↓
uploadBufferToCloudinary()
   ↓
Cloudinary
   ↓
secure_url returned
```

It also checks required Cloudinary environment variables:

```js
const requiredEnvVars = [
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET"
];
```

If any are missing, the backend returns an error instead of failing silently.

The upload folder is:

```text
campuscart/listings
```

So Cloudinary images are grouped under that folder.

---

# 16. `middleware/authMiddleware.js`: route protection

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

Header:

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

Otherwise, it returns:

```json
{
  "message": "Access denied. Admin only."
}
```

---

# 17. `middleware/uploadMiddleware.js`: image file validation

This middleware handles image files from the frontend.

Accepted file types:

```text
image/jpeg
image/jpg
image/png
image/webp
```

Max file size:

```text
5 MB
```

Required form-data key:

```text
image
```

So in Swagger, Postman, or frontend FormData:

```js
formData.append("image", file);
```

If the user uploads something invalid, the backend returns an error.

---

# 18. `routes/authRoutes.js`: register, verify email, login

This is the main authentication file.

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
8. Send email using Nodemailer/Gmail SMTP
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

# 19. `routes/listingRoutes.js`: listing CRUD and listing images

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

This is important. The frontend does not send the seller ID. The backend gets the seller from the JWT-authenticated user.

## Upload image to existing listing

```text
POST /api/listings/:id/images
```

Protected route.

Requires:

```http
Authorization: Bearer JWT_TOKEN_HERE
```

Body type:

```text
multipart/form-data
```

Required key:

```text
image
```

Backend checks:

```text
1. User is logged in
2. Listing exists
3. Listing is not removed
4. User owns listing OR user is admin
5. File is valid image
6. Upload image to Cloudinary
7. Push Cloudinary secure_url into listing.imageUrls
8. Save listing
```

This returns the uploaded image info and the updated listing.

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

Returns listings created by the logged-in user.

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

Returns saved listings for the current user.

---

# 20. `routes/uploadRoutes.js`: standalone image upload

This route uploads an image to Cloudinary without attaching it directly to a listing.

```text
POST /api/uploads/listing-image
```

Protected route.

Requires:

```http
Authorization: Bearer JWT_TOKEN_HERE
```

Body type:

```text
multipart/form-data
```

Required key:

```text
image
```

Successful response:

```json
{
  "message": "Image uploaded successfully",
  "image": {
    "url": "https://res.cloudinary.com/...",
    "publicId": "campuscart/listings/...",
    "width": 1200,
    "height": 800,
    "format": "jpg",
    "bytes": 240000
  }
}
```

Use this when the frontend wants to upload the image first and then include the returned URL in `POST /api/listings`.

---

# 21. `routes/inquiryRoutes.js`: buyer messages

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

This prevents a seller from sending an inquiry to their own listing.

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

# 22. `routes/adminRoutes.js`: admin dashboard API

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

This supports the admin dashboard.

---

# 23. `config/swagger.js`: API documentation

Swagger describes the API in OpenAPI format.

It defines:

```text
API title
server URL
security scheme
request schemas
routes
parameters
responses
multipart image upload routes
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
1. Register user
2. Verify email
3. Login
4. Copy JWT token
5. Click Authorize
6. Paste token
7. Test protected routes
```

Usually with Swagger bearerAuth, paste the token value only. If it fails, paste:

```text
Bearer TOKEN_HERE
```

depending on Swagger UI behavior.

Swagger now also documents:

```text
POST /api/uploads/listing-image
POST /api/listings/{id}/images
```

Both use:

```text
multipart/form-data
key: image
type: file
```

---

# 24. Database collections

MongoDB database:

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

Example document:

```json
{
  "_id": "...",
  "title": "Used Calculus Textbook",
  "description": "Good condition textbook.",
  "price": 35,
  "category": "textbooks",
  "condition": "used",
  "imageUrls": [
    "https://res.cloudinary.com/your-cloud-name/image/upload/campuscart/listings/example.jpg"
  ],
  "seller": "USER_OBJECT_ID",
  "status": "active",
  "isFlagged": false
}
```

## `inquiries`

Example document:

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

Cloudinary images are not stored inside MongoDB as files. MongoDB stores only the Cloudinary image URLs.

---

# 25. Full auth flow from frontend perspective

## Register

React sends:

```http
POST /api/auth/register
```

Backend creates the user and sends verification email.

Frontend shows:

```text
Please check your email to verify your account.
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

## Upload listing image

React sends:

```http
POST /api/listings/:id/images
Authorization: Bearer token
Content-Type: multipart/form-data
```

with FormData:

```js
const formData = new FormData();
formData.append("image", selectedFile);
```

Backend uploads to Cloudinary and saves the returned URL into the listing.

## Admin routes

Only an admin user token can access:

```text
/api/admin/*
```

---

# 26. Password validation: backend vs frontend

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

# 27. Image upload validation

Image validation happens in the backend.

Current rules:

```text
accepted: jpg, jpeg, png, webp
max size: 5 MB
form-data key: image
```

If the file is not valid, backend returns a 400 error.

Example error:

```json
{
  "message": "Image upload failed",
  "error": "Only image files are allowed. Use JPG, JPEG, PNG, or WEBP."
}
```

This protects the backend from random files being uploaded.

---

# 28. How to test everything

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
  "email": "real-email-you-can-open@gmail.com",
  "password": "Password1!"
}
```

## 4. Check email

Click the verification link.

## 5. Login

```json
{
  "email": "real-email-you-can-open@gmail.com",
  "password": "Password1!"
}
```

Copy token.

## 6. Authorize in Swagger

Click **Authorize**.

Paste the token.

## 7. Create listing

```json
{
  "title": "Used Calculus Textbook",
  "description": "Good condition textbook.",
  "price": 35,
  "category": "textbooks",
  "condition": "used",
  "imageUrls": []
}
```

Copy the returned listing `_id`.

## 8. Upload image directly to that listing

Use:

```text
POST /api/listings/{id}/images
```

In Swagger:

```text
id = listing id
image = choose file
```

This should return an updated listing with:

```json
"imageUrls": [
  "https://res.cloudinary.com/..."
]
```

## 9. Test standalone image upload

Use:

```text
POST /api/uploads/listing-image
```

In Swagger:

```text
image = choose file
```

This returns an image URL without saving it to a listing.

## 10. Test save/inquiry/admin routes

Use a second verified user for buyer behavior.

Use an admin user only for admin dashboard testing.

---

# 29. Postman image upload test

For standalone image upload:

```http
POST http://localhost:5000/api/uploads/listing-image
Authorization: Bearer JWT_TOKEN_HERE
```

Body:

```text
form-data
key: image
type: File
value: choose image file
```

For upload and save to listing:

```http
POST http://localhost:5000/api/listings/LISTING_ID/images
Authorization: Bearer JWT_TOKEN_HERE
```

Body:

```text
form-data
key: image
type: File
value: choose image file
```

---

# 30. Current professional/security notes

Fix or keep in mind before final deployment:

1. **Do not commit `.env`.**

2. **Rotate any MongoDB password that was pasted into chat or shared anywhere.**

3. **Keep `CLOUDINARY_API_SECRET` private.**

4. **Do not put Cloudinary API secret in React.**

5. Replace `JWT_SECRET` with a long random value:

```powershell
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

6. Use a project Gmail later instead of personal Gmail.

7. Public registration should not allow users to choose:

```json
{
  "role": "admin"
}
```

The backend should always set public registered users to:

```text
student
```

8. Keep email verification URL out of the register response in final production version.

9. Use deployed URLs later:

```env
CLIENT_URL=https://your-frontend.vercel.app
FRONTEND_URL=https://your-frontend.vercel.app
API_BASE_URL=https://your-backend.onrender.com
```

10. Atlas Network Access should be restricted later instead of open to all IPs.

11. Cloudinary uploads should stay behind protected routes so only logged-in verified users can upload.

12. If image deletion is added later, store Cloudinary `publicId` in MongoDB too. Right now the listing stores only image URLs.

---

# 31. Final backend responsibilities

The backend now handles the important full-stack work:

```text
MongoDB stores users, listings, and inquiries
Express exposes the API
JWT controls logged-in sessions
bcrypt protects passwords
Gmail SMTP sends email verification
crypto creates secure verification tokens
Cloudinary stores uploaded listing images
Multer handles image file uploads
Swagger documents and tests the API
Admin routes control platform moderation
```
