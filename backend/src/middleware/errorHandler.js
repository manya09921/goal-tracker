const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    message = `Duplicate value for field: ${field}`;
    statusCode = 409;
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(", ");
    statusCode = 400;
  }

  // Mongoose CastError (invalid ObjectId)
  if (err.name === "CastError") {
    message = `Invalid ID format: ${err.value}`;
    statusCode = 400;
  }

  if (process.env.NODE_ENV === "development") {
    console.error(`[ERROR] ${err.stack}`);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

// 404 handler
const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

module.exports = { errorHandler, notFound };
