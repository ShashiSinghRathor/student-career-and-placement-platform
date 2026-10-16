const RecruiterProfile = require("../models/RecruiterProfile");
const Company = require("../models/Company");
const Job = require("../models/Job");
const Application = require("../models/Application");
const Interview = require("../models/Interview");
const mongoose = require("mongoose");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");

// GET /api/recruiter/dashboard
const dashboard = asyncHandler(async (req, res) => {
  const recruiterId = req.user._id;

  const [profile, jobsPosted, stats, recentApps, interviews, jobsByType] = await Promise.all([
    RecruiterProfile.findOne({ userId: recruiterId }).populate("companyId"),
    Job.countDocuments({ recruiterId }),
    Application.aggregate([
      { $match: { recruiterId: new mongoose.Types.ObjectId(recruiterId) } },
      { $group: { _id: "$status", n: { $sum: 1 } } },
    ]),
    Application.find({ recruiterId })
      .sort({ appliedAt: -1 })
      .limit(8)
      .populate({ path: "studentId", select: "name email profileImage" })
      .populate({ path: "jobId", select: "title" }),
    Interview.find({ recruiterId, date: { $gte: new Date() } }).sort({ date: 1 }).limit(5)
      .populate({ path: "applicationId", select: "studentId", populate: { path: "studentId", select: "name" } }),
    Job.aggregate([
      { $match: { recruiterId: new mongoose.Types.ObjectId(recruiterId) } },
      { $group: { _id: "$jobType", count: { $sum: 1 } } },
    ]),
  ]);

  const st = {};
  stats.forEach((s) => (st[s._id] = s.n));
  const totalApplicants = stats.reduce((a, b) => a + b.n, 0);

  // applicants per week for chart (last 12 weeks)
  const applicantsOverTime = await Application.aggregate([
    { $match: { recruiterId: new mongoose.Types.ObjectId(recruiterId), appliedAt: { $gte: new Date(Date.now() - 90 * 24 * 3600 * 1000) } } },
    { $group: { _id: { $dateToString: { format: "%Y-%W", date: "$appliedAt" } }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);

  res.json({
    success: true,
    data: {
      company: profile?.companyId || null,
      counts: {
        jobsPosted,
        totalApplicants,
        shortlisted: st["Shortlisted"] || 0,
        interviews: st["Interview Scheduled"] || 0,
        selected: st["Selected"] || 0,
        rejected: st["Rejected"] || 0,
        underReview: (st["Applied"] || 0) + (st["Under Review"] || 0),
      },
      statusChart: stats.map((s) => ({ status: s._id, value: s.n })),
      jobsByType: jobsByType.map((s) => ({ type: s._id, count: s.count })),
      applicantsOverTime: applicantsOverTime.map((s) => ({ period: s._id, count: s.count })),
      recentApplications: recentApps,
      upcomingInterviews: interviews,
    },
  });
});

// GET /api/recruiter/company
const getCompany = asyncHandler(async (req, res) => {
  const rec = await RecruiterProfile.findOne({ userId: req.user._id }).populate("companyId");
  if (!rec?.companyId) return res.json({ success: true, company: null });
  res.json({ success: true, company: rec.companyId });
});

// POST /api/recruiter/company
const createCompany = asyncHandler(async (req, res) => {
  const existing = await RecruiterProfile.findOne({ userId: req.user._id });
  if (existing?.companyId) throw ApiError.conflict("Company profile already exists");

  const company = await Company.create({ ...req.body, createdBy: req.user._id });
  await RecruiterProfile.findOneAndUpdate({ userId: req.user._id }, { companyId: company._id });
  res.status(201).json({ success: true, company });
});

// PUT /api/recruiter/company
const updateCompany = asyncHandler(async (req, res) => {
  const rec = await RecruiterProfile.findOne({ userId: req.user._id });
  if (!rec?.companyId) throw ApiError.notFound("Create your company profile first");
  const company = await Company.findById(rec.companyId);
  if (!company) throw ApiError.notFound("Company not found");

  const fields = ["name", "description", "website", "industry", "location", "size", "founded", "logo"];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) company[f] = req.body[f];
  });
  await company.save();
  res.json({ success: true, company });
});

module.exports = { dashboard, getCompany, createCompany, updateCompany };
