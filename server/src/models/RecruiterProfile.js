const mongoose = require("mongoose");

const recruiterProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company" },
    designation: { type: String, trim: true },
    bio: { type: String, trim: true, maxlength: 800 },
    phone: { type: String, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("RecruiterProfile", recruiterProfileSchema);
