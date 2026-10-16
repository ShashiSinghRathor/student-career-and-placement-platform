const { validationResult } = require("express-validator");
const ApiError = require("../utils/ApiError");

// Must come after an express-validator chain in the route definition
exports.checkValidation = (req, res, next) => {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    const errors = result.array().map((e) => ({ field: e.path, msg: e.msg }));
    return next(ApiError.badRequest("Validation failed", errors));
  }
  next();
};

Object.assign(exports, require("./rules"));
