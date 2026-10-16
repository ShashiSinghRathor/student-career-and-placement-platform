const env = require("../config/env");
const ApiError = require("../utils/ApiError");

const notFound = (req, res, next) => {
  next(ApiError.notFound(`Route ${req.originalUrl} not found`));
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let status = err.statusCode || 500;
  let message = err.message || "Something went wrong";
  let errors = err.errors || [];

  if (err.name === "CastError") {
    status = 404;
    message = "Resource not found";
  }
  if (err.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyValue || {})[0];
    message = field ? `Duplicate value for "${field}"` : "Duplicate resource";
  }
  if (err.name === "ValidationError") {
    status = 400;
    message = "Validation failed";
    errors = Object.entries(err.errors || {}).map(([f, v]) => ({ field: f, msg: v.message }));
  }
  if (err.code === "LIMIT_FILE_SIZE") {
    status = 400;
    message = "File too large (max 5MB)";
  }
  if (err.code === 12 || err.code === 13) {
    // Mongoose server selection
    status = 500;
    message = "Database temporarily unavailable";
  }

  if (status >= 500) {
    console.error("💥", err);
  }

  res.status(status).json({
    success: false,
    message,
    errors: errors.length ? errors : undefined,
    ...(env.isProd ? {} : { stack: err.stack }),
  });
};

module.exports = { notFound, errorHandler };
