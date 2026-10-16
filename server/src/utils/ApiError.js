class ApiError extends Error {
  constructor(statusCode, message, errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true;
  }
  static badRequest(m, e) { return new ApiError(400, m, e); }
  static unauthorized(m = "Unauthorized") { return new ApiError(401, m); }
  static forbidden(m = "Forbidden") { return new ApiError(403, m); }
  static notFound(m = "Resource not found") { return new ApiError(404, m); }
  static conflict(m) { return new ApiError(409, m); }
  static internal(m = "Something went wrong") { return new ApiError(500, m); }
}

module.exports = ApiError;
