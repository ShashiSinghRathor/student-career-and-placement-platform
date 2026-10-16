const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    reporterId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    targetType: { type: String, enum: ["job", "user", "company", "message"], required: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
    reason: { type: String, required: true, maxlength: 1000 },
    status: { type: String, enum: ["open", "resolved", "dismissed"], default: "open" },
    resolutionNote: { type: String },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

reportSchema.index({ status: 1 });

module.exports = mongoose.model("Report", reportSchema);
