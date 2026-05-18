const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const goalRoutes = require("./routes/goalRoutes");
const checkinRoutes = require("./routes/checkinRoutes");
const auditRoutes = require("./routes/auditRoutes");
const { errorHandler, notFound } = require("./middleware/errorHandler");

const app = express();

// CORS — allow frontend dev server and production origin
const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:3000").split(",");
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  })
);

// Security headers
app.use(helmet());

// Request logging
if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { success: false, message: "Too many requests. Please try again later." },
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: "Too many auth attempts. Please try again later." },
});

app.use("/api/auth", authLimiter);
app.use(limiter);

// Body parsers
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get("/health", (req, res) => res.json({ status: "ok", timestamp: new Date().toISOString() }));

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/goals", goalRoutes);
app.use("/api/checkins", checkinRoutes);
app.use("/api/audit", auditRoutes);

// 404 + error handling
app.use(notFound);
app.use(errorHandler);

module.exports = app;
