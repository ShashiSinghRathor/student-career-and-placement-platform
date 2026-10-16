const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const StudentProfile = require("../models/StudentProfile");
const RecruiterProfile = require("../models/RecruiterProfile");
const Company = require("../models/Company");
const env = require("../config/env");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { sendEmail } = require("../services/emailService");

const signToken = (userId) =>
  jwt.sign({ id: userId }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });

const sendAuthResponse = (user, res, statusCode = 200) => {
  const token = signToken(user._id);
  user.password = undefined;
  res.status(statusCode).json({
    success: true,
    token,
    user,
  });
};

// POST /api/auth/register
exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, role, college, companyName } = req.body;
  if (role === "admin") throw ApiError.forbidden("Admin accounts cannot be self-registered");

  const exists = await User.findOne({ email });
  if (exists) throw ApiError.conflict("An account with this email already exists");

  const user = await User.create({ name, email, password, role, approved: true });

  if (role === "student") {
    await StudentProfile.create({ userId: user._id, college: college || "Not specified" });
  } else if (role === "recruiter") {
    let companyId;
    if (companyName) {
      const company = await Company.create({ name: companyName, createdBy: user._id });
      companyId = company._id;
    }
    await RecruiterProfile.create({ userId: user._id, companyId });
  }

  await sendEmail({
    to: email,
    subject: "Welcome to CareerConnect 🎓",
    text: `Hi ${name}, your CareerConnect account has been created. Start exploring opportunities now!`,
  });

  sendAuthResponse(user, res, 201);
});

// POST /api/auth/login
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized("Invalid email or password");
  }
  if (!user.isActive) throw ApiError.forbidden("Your account has been deactivated. Contact support.");

  // Recruiters must be approved by admin before login
  if (user.role === "recruiter" && !user.approved) {
    throw ApiError.forbidden("Your account is pending admin approval. You'll be notified once approved.");
  }

  await sendAuthResponse(user, res);
});

// GET /api/auth/me
exports.me = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user });
});

// PUT /api/auth/profile  (name, profileImage, phone)
exports.updateMe = asyncHandler(async (req, res) => {
  const { name, phone, profileImage } = req.body;
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: { ...(name && { name }), ...(phone !== undefined && { phone }), ...(profileImage && { profileImage }) } },
    { new: true, runValidators: true }
  );
  res.json({ success: true, user });
});

// PUT /api/auth/password
exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select("+password");
  if (!(await user.comparePassword(currentPassword))) {
    throw ApiError.unauthorized("Current password is incorrect");
  }
  user.password = newPassword;
  await user.save();
  sendAuthResponse(user, res);
});

// POST /api/auth/forgot-password
exports.forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  // always respond OK to avoid email enumeration
  if (!user) {
    return res.json({ success: true, message: "If that email exists, a reset link has been sent." });
  }
  const resetToken = crypto.randomBytes(32).toString("hex");
  user.passwordResetToken = crypto.createHash("sha256").update(resetToken).digest("hex");
  user.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${env.clientUrl}/reset-password/${resetToken}`;
  await sendEmail({
    to: email,
    subject: "CareerConnect – Password Reset",
    text: `Reset your password: ${resetUrl} (valid 10 minutes)`,
  });

  res.json({ success: true, message: "If that email exists, a reset link has been sent." });
});

// POST /api/auth/reset-password/:token
exports.resetPassword = asyncHandler(async (req, res) => {
  const hashed = crypto.createHash("sha256").update(req.params.token).digest("hex");
  const user = await User.findOne({
    passwordResetToken: hashed,
    passwordResetExpires: { $gt: Date.now() },
  }).select("+passwordResetToken");

  if (!user) throw ApiError.badRequest("Reset link is invalid or has expired");

  user.password = req.body.password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  sendAuthResponse(user, res);
});

// POST /api/auth/logout  (stateless: client clears token; cookie clear here)
exports.logout = asyncHandler(async (req, res) => {
  res.clearCookie("token");
  res.json({ success: true, message: "Logged out" });
});
