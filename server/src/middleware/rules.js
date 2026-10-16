const { body, param, query } = require("express-validator");

const emailRule = body("email").isEmail().withMessage("Valid email required").normalizeEmail();
const passwordRule = (name = "password") =>
  body(name)
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/[A-Za-z]/)
    .withMessage("Password must contain a letter")
    .matches(/[0-9]/)
    .withMessage("Password must contain a number");

exports.registerRules = [
  body("name").trim().escape().isLength({ min: 2, max: 80 }).withMessage("Name is required"),
  emailRule,
  passwordRule(),
  body("role").isIn(["student", "recruiter"]).withMessage("Role must be student or recruiter"),
  body("confirmPassword")
    .custom((v, { req }) => v === req.body.password)
    .withMessage("Passwords do not match"),
];

exports.loginRules = [emailRule, body("password").notEmpty().withMessage("Password is required")];

exports.emailOnly = [emailRule];

exports.resetRules = [
  body("token").notEmpty().withMessage("Reset token required"),
  passwordRule("password"),
];

exports.jobRules = [
  body("title").trim().escape().isLength({ min: 3, max: 120 }).withMessage("Job title required"),
  body("description").trim().isLength({ min: 30, max: 8000 }).withMessage("Description must be at least 30 characters"),
  body("jobType").isIn(["internship", "full-time", "part-time", "contract"]).withMessage("Invalid job type"),
  body("location").trim().escape().notEmpty().withMessage("Location required"),
  body("deadline").isISO8601().withMessage("Valid deadline required"),
  body("salary.min").optional({ nullable: true }).isNumber(),
  body("salary.max").optional({ nullable: true }).isNumber(),
  body("eligibleBranches").optional(),
];

exports.applicationRules = [
  param("id").isMongoId().withMessage("Invalid job id"),
  body("coverLetter").optional({ values: "falsy" }).isLength({ max: 4000 }).withMessage("Cover letter too long"),
];

exports.interviewRules = [
  body("applicationId").isMongoId().withMessage("Invalid application id"),
  body("date").isISO8601().withMessage("Valid date required"),
  body("time").trim().notEmpty().withMessage("Time required"),
  body("type").isIn(["Online", "Offline", "Phone"]).withMessage("Invalid interview type"),
];

exports.mongoIdParam = param("id").isMongoId().withMessage("Invalid id");
