const mongoose = require("mongoose");

const eligibilitySchema = new mongoose.Schema(
  {
    minCgpa: { type: Number, min: 0, max: 10 },
    allowedBranches: { type: [String], default: [] },
    gradYear: { type: [Number], default: [] },
    minExperienceMonths: { type: Number, default: 0 },
  },
  { _id: false }
);

const jobSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
    recruiterId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, required: true, maxlength: 8000 },
    responsibilities: { type: [String], default: [] },
    requirements: { type: [String], default: [] },
    jobType: {
      type: String,
      enum: ["internship", "full-time", "part-time", "contract"],
      required: true,
    },
    mode: { type: String, enum: ["onsite", "remote", "hybrid"], default: "onsite" },
    location: { type: String, required: true, trim: true },
    salary: {
      min: { type: Number, default: 0 },
      max: { type: Number, default: 0 },
      currency: { type: String, default: "INR" },
    },
    durationMonths: { type: Number }, // for internships
    openings: { type: Number, default: 1, min: 1 },
    requiredSkills: { type: [String], default: [] },
    eligibility: { type: eligibilitySchema, default: () => ({}) },
    experience: {
      type: String,
      enum: ["fresher", "1-3 years", "3-5 years", "5+ years"],
      default: "fresher",
    },
    deadline: { type: Date, required: true },
    status: {
      type: String,
      enum: ["pending", "active", "rejected", "closed", "draft"],
      default: "pending",
    },
    rejectionReason: { type: String },
    views: { type: Number, default: 0 },
  },
  { timestamps: true, toJSON: { virtuals: true } }
);

jobSchema.index({ title: "text", description: "text" });
jobSchema.index({ status: 1, deadline: 1 });
jobSchema.index({ companyId: 1 });
jobSchema.index({ location: 1 });
jobSchema.index({ jobType: 1 });

jobSchema.virtual("applicantCount", {
  ref: "Application",
  localField: "_id",
  foreignField: "jobId",
  count: true,
});

jobSchema.virtual("isActive").get(function () {
  return this.status === "active" && (!this.deadline || this.deadline > new Date());
});

module.exports = mongoose.model("Job", jobSchema);
