const mongoose = require("mongoose");

const APP_STATUSES = [
  "Applied",
  "Under Review",
  "Shortlisted",
  "Interview Scheduled",
  "Selected",
  "Rejected",
];

const applicationSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
    recruiterId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company" },
    resumeUrl: { type: String },
    coverLetter: { type: String, maxlength: 4000 },
    status: { type: String, enum: APP_STATUSES, default: "Applied" },
    history: [
      {
        status: String,
        note: String,
        at: { type: Date, default: Date.now },
      },
    ],
    scheduledInterviews: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Interview" },
    ],
    appliedAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

applicationSchema.index({ studentId: 1, jobId: 1 }, { unique: true });
applicationSchema.index({ recruiterId: 1, status: 1 });
applicationSchema.index({ jobId: 1 });

module.exports = mongoose.model("Application", applicationSchema);
module.exports.APP_STATUSES = APP_STATUSES;
