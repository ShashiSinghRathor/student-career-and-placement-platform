const mongoose = require("mongoose");

const interviewSchema = new mongoose.Schema(
  {
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Application",
      required: true,
    },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    recruiterId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    round: { type: String, default: "Technical Round 1" },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    type: { type: String, enum: ["Online", "Offline", "Phone"], default: "Online" },
    meetingLink: { type: String },
    location: { type: String }, // for offline
    interviewer: { type: String },
    notes: { type: String, maxlength: 2000 },
    status: {
      type: String,
      enum: ["Scheduled", "Completed", "Cancelled", "Rescheduled"],
      default: "Scheduled",
    },
  },
  { timestamps: true }
);

interviewSchema.index({ studentId: 1, date: 1 });
interviewSchema.index({ recruiterId: 1, date: 1 });

module.exports = mongoose.model("Interview", interviewSchema);
