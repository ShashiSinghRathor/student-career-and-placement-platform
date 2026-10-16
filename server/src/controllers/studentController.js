const StudentProfile = require("../models/StudentProfile");
const User = require("../models/User");
const Application = require("../models/Application");
const Interview = require("../models/Interview");
const Notification = require("../models/Notification");
const SavedJob = require("../models/SavedJob");
const mongoose = require("mongoose");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");

const getMyProfile = asyncHandler(async (req, res) => {
  let profile = await StudentProfile.findOne({ userId: req.user._id }).populate(
    "userId",
    "name email profileImage role createdAt isActive"
  );
  if (!profile) throw ApiError.notFound("Profile not found");
  res.json({ success: true, profile, completion: profile.completionPercent() });
});

// PUT /api/students/profile — merge top-level fields + array ops
updateHandlers = {
  skills: (profile, value) => {
    profile.skills = Array.isArray(value) ? value.map(String) : profile.skills;
  },
  push: (profile, arrayName, item) => {
    if (!profile[arrayName]) profile[arrayName] = [];
    const sub = profile[arrayName];
    const doc = sub.id(item._id);
    if (doc) { Object.assign(doc, item); } else { sub.push(item); }
  },
  pull: (profile, arrayName, itemId) => {
    if (!profile[arrayName]) return;
    profile[arrayName] = profile[arrayName].filter((p) => p._id?.toString() !== itemId);
  },
};

const updateProfile = asyncHandler(async (req, res) => {
  const { education, projects, experience, certifications, achievements, skills, ...fields } = req.body;

  if (education !== undefined) updateHandlers.skills; // no-op

  const allowed = [
    "college", "degree", "branch", "graduationYear", "cgpa", "bio", "headline",
    "location", "phone", "dateOfBirth", "gender", "resumeUrl", "githubUrl", "linkedinUrl",
  ];
  const set = {};
  allowed.forEach((k) => {
    if (fields[k] !== undefined) set[k] = fields[k];
  });

  let profile = await StudentProfile.findByIdAndUpdate(
    req.user._id,
    { $set: set },
    { new: true }
  );
  profile = await StudentProfile.findOne({ userId: req.user._id }).populate("userId", "name email profileImage");

  if (!profile) throw ApiError.notFound("Student profile missing — register again");

  if (skills !== undefined) profile.skills = (Array.isArray(skills) ? skills : []).map(String);

  const arrayOps = { education, projects, experience, certifications, achievements };

  for (const key of Object.keys(arrayOps)) {
    const opvals = arrayOps[key];
    if (opvals === undefined) continue;
    if (Array.isArray(opvals)) {
      opvals.forEach((item) => {
        const id = item._id;
        if (id && profile[key].id(id)) {
          Object.assign(profile[key].id(id), item);
        } else {
          profile[key].push(item);
        }
      });
    }
  }

  await profile.save();
  res.json({ success: true, profile, completion: profile.completionPercent() });
});

// DELETE /api/students/profile/:array/:itemId
const deleteArrayItem = asyncHandler(async (req, res) => {
  const { array, itemId } = req.params;
  const allowedArrays = ["education", "projects", "experience", "certifications", "achievements"];
  if (!allowedArrays.includes(array)) throw ApiError.badRequest("Unknown field");
  const profile = await StudentProfile.findOne({ userId: req.user._id });
  profile[array] = profile[array].filter((item) => item._id?.toString() !== itemId);
  await profile.save();
  res.json({ success: true, profile, completion: profile.completionPercent() });
});

// GET /api/students/dashboard
const dashboard = asyncHandler(async (req, res) => {
  const studentId = req.user._id;

  const [profile, applications, interviews, savedJobs, recentNotifications, statusCounts, profileObj] = await Promise.all([
    StudentProfile.findOne({ userId: studentId }),
    Application.find({ studentId })
      .sort({ appliedAt: -1 })
      .limit(8)
      .populate({ path: "jobId", select: "title jobType location salary" })
      .populate({ path: "companyId", select: "name logo" }),
    Interview.find({ studentId, date: { $gte: new Date() } })
      .sort({ date: 1 })
      .limit(5)
      .populate({ path: "applicationId", select: "status", populate: { path: "jobId", select: "title" } }),
    SavedJob.countDocuments({ studentId }),
    Notification.find({ userId: studentId }).sort({ createdAt: -1 }).limit(5),
    Application.aggregate([{ $match: { studentId: new mongoose.Types.ObjectId(studentId) } }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
    StudentProfile.findOne({ userId: studentId }),
  ]);

  const stats = {};
  statusCounts.forEach((s) => { stats[s._id] = s.count; });

  const total = applications.length;
  res.json({
    success: true,
    data: {
      welcome: `Welcome back, ${req.user.name}!`,
      completion: profileObj ? profileObj.completionPercent() : 0,
      counts: {
        applications: stats["Applied"] + stats["Under Review"] + stats["Shortlisted"] + stats["Interview Scheduled"] + stats["Selected"] + stats["Rejected"] || 0,
        underReview: (stats["Under Review"] || 0) + (stats["Applied"] || 0),
        shortlisted: stats["Shortlisted"] || 0,
        interviews: (stats["Interview Scheduled"] || 0) + (stats["Selected"] || 0),
        offers: stats["Selected"] || 0,
        rejected: stats["Rejected"] || 0,
        savedJobs,
      },
      statusChart: Object.keys(stats).map((k) => ({ status: k, value: stats[k] })),
      recentApplications: applications /* limit 8 */,
      upcomingInterviews: interviews,
      notifications: recentNotifications,
    },
  });
});

// GET /api/students/analytics
const analytics = asyncHandler(async (req, res) => {
  const studentId = req.user._id;

  const byStatus = await Application.aggregate([
    { $match: { studentId: new mongoose.Types.ObjectId(studentId) } },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);

  const byMonth = await Application.aggregate([
    { $match: { studentId: new mongoose.Types.ObjectId(studentId) } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m", date: "$appliedAt" } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
    { $limit: 12 },
  ]);

  const byJobType = await Application.aggregate([
    { $match: { studentId: new mongoose.Types.ObjectId(studentId) } },
    { $lookup: { from: "jobs", localField: "jobId", foreignField: "_id", as: "job" } },
    { $unwind: "$job" },
    { $group: { _id: "$job.jobType", count: { $sum: 1 } } },
  ]);

  const topSkillsFromAppliedJobs = await Application.aggregate([
    { $match: { studentId: new mongoose.Types.ObjectId(studentId) } },
    { $lookup: { from: "jobs", localField: "jobId", foreignField: "_id", as: "job" } },
    { $unwind: "$job" },
    { $unwind: "$job.requiredSkills" },
    { $group: { _id: "$job.requiredSkills", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 },
  ]);

  res.json({
    success: true,
    analytics: {
      byStatus: byStatus.map((s) => ({ status: s._id, count: s.count })),
      byMonth: byMonth.map((s) => ({ month: s._id, count: s.count })),
      byJobType: byJobType.map((s) => ({ type: s._id, count: s.count })),
      demandSkills: topSkillsFromAppliedJobs.map((s) => ({ skill: s._id || "N/A", count: s.count })),
    },
  });
});

module.exports = { getMyProfile, updateProfile, deleteArrayItem, dashboard, analytics };
