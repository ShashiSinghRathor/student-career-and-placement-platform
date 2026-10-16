const mongoose = require("mongoose");

const companySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    logo: { type: String, default: "" },
    description: { type: String, maxlength: 3000 },
    website: { type: String, trim: true },
    industry: { type: String, trim: true },
    location: { type: String, trim: true },
    size: {
      type: String,
      enum: ["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"],
      default: "11-50",
    },
    founded: { type: Number },
    verified: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

companySchema.index({ name: "text", industry: "text" });

module.exports = mongoose.model("Company", companySchema);
