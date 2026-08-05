const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const swaggerUi = require("swagger-ui-express");

const connectDB = require("./config/db");
const swaggerDocument = require("./config/swagger");
const {
  metricsMiddleware,
  metricsHandler
} = require("./monitoring/metrics");
const { getRuntimeInfo } = require("./utils/runtimeEnvironment");

dotenv.config();

connectDB();

const app = express();

// Prevent Express from revealing the framework.
app.disable("x-powered-by");

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true
  })
);

app.use(express.json());

// Record HTTP request count, status codes, and request latency.
app.use(metricsMiddleware);

// Prometheus scrape endpoint.
// This must be declared before the final 404 handler.
app.get("/metrics", metricsHandler);

app.get("/", (req, res) => {
  res.json({
    message: "CampusCart API is running",
    ...getRuntimeInfo()
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Backend health check successful",
    ...getRuntimeInfo()
  });
});

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument)
);

app.get("/api-docs.json", (req, res) => {
  res.json(swaggerDocument);
});

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/listings", require("./routes/listingRoutes"));
app.use("/api/inquiries", require("./routes/inquiryRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/uploads", require("./routes/uploadRoutes"));
app.use("/api/ai", require("./routes/aiRoutes"));

// This must remain last.
app.use((req, res) => {
  res.status(404).json({
    message: "Route not found"
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  const runtime = getRuntimeInfo();
  console.log(`Server running on port ${PORT}`);
  console.log(`Runtime environment: ${runtime.environment}`);
  console.log(`Email verification mode: ${runtime.emailVerificationMode}`);
});
