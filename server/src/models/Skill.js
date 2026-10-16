const mongoose = require("mongoose");

const skillSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, lowercase: true, trim: true },
    category: {
      type: String,
      default: "other",
      enum: ["language", "framework", "database", "tool", "cloud", "design", "other"],
    },
  },
  { timestamps: true }
);

skillSchema.statics.search = function (q, limit = 20) {
  return this.find({ name: new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") })
    .limit(limit)
    .sort("name");
};

module.exports = mongoose.model("Skill", skillSchema);
