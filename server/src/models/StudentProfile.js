const mongoose = require("mongoose");

const educationSchema = new mongoose.Schema(
  {
    school: { type: String, required: true, trim: true },
    degree: { type: String, required: true, trim: true },
    branch: { type: String, trim: true },
    startYear: { type: Number },
    endYear: { type: Number },
    score: { type: String, trim: true },
  },
  { _id: true }
);

const projectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, maxlength: 1200 },
    techStack: { type: [String], default: [] },
    link: { type: String, trim: true },
  },
  { _id: true }
);

const experienceSchema = new mongoose.Schema(
  {
    company: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true },
    from: { type: String },
    to: { type: String },
    current: { type: Boolean, default: false },
    description: { type: String, maxlength: 1200 },
  },
  { _id: true }
);

const certificationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    issuer: { type: String, trim: true },
    issueDate: { type: String },
    link: { type: String, trim: true },
  },
  { _id: true }
);

const achievementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, maxlength: 600 },
    date: { type: String },
  },
  { _id: true }
);

const studentProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    college: { type: String, required: true, trim: true },
    degree: { type: String, trim: true, default: "B.Tech" },
    branch: { type: String, trim: true },
    graduationYear: { type: Number, min: 2000, max: 2100 },
    cgpa: { type: Number, min: 0, max: 10 },
    bio: { type: String, trim: true, maxlength: 800 },
    headline: { type: String, trim: true, maxlength: 120 },
    location: { type: String, trim: true },
    phone: { type: String },
    dateOfBirth: { type: String },
    gender: { type: String, enum: ["male", "female", "other", ""] },
    skills: [{ type: String, trim: true }],
    education: [educationSchema],
    projects: [projectSchema],
    experience: [experienceSchema],
    certifications: [certificationSchema],
    achievements: [achievementSchema],
    resumeUrl: { type: String },
    githubUrl: { type: String },
    linkedinUrl: { type: String },
  },
  { timestamps: true }
);

studentProfileSchema.index({ branch: 1, graduationYear: 1 });
studentProfileSchema.index({ skills: 1 });

// Profile completion percentage (0-100)
studentProfileSchema.methods.completionPercent = function () {
  let score = 0;
  const add = (cond, w) => { if (cond) score += w; };
  add(this.userId?.name !== undefined, 5);
  add(!!this.college, 10);
  add(!!this.degree, 5);
  add(!!this.branch, 5);
  add(!!this.graduationYear, 5);
  add(typeof this.cgpa === "number" && this.cgpa > 0, 10);
  add((this.skills || []).length >= 3, 15);
  add((this.education || []).length >= 1, 10);
  add((this.projects || []).length >= 1, 10);
  add((this.certifications || []).length >= 0 && (this.certifications || []).length >= 1, 5);
  add((this.achievements || []).length >= 1, 5);
  add(!!this.resumeUrl, 15);
  add(!!this.githubUrl || !!this.linkedinUrl, 5);
  add(!!this.bio, 5);
  return Math.min(100, score);
};

module.exports = mongoose.model("StudentProfile", studentProfileSchema);
