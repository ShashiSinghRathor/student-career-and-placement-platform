const mongoose = require("mongoose");
const User = require("../models/User");
const StudentProfile = require("../models/StudentProfile");
const RecruiterProfile = require("../models/RecruiterProfile");
const Company = require("../models/Company");
const Job = require("../models/Job");
const Application = require("../models/Application");
const Interview = require("../models/Interview");
const Report = require("../models/Report");
const { parsePagination, buildPageMeta } = require("../utils/pagination");
const { escapeRegex, cleanStr } = require("../utils/normalize");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { notify } = require("../services/notificationService");

// GET /api/admin/statistics
const statistics = asyncHandler(async (req, res) => {
  const [totalStudents, totalRecruiters, totalCompanies, totalJobs, activeJobs, totalApplications, totalPlacements, totalInterviews, pendingJobs, pendingRecruiters, openReports] =
    await Promise.all([
      User.countDocuments({ role: "student" }),
      User.countDocuments({ role: "recruiter" }),
      Company.countDocuments(),
      Job.countDocuments(),
      Job.countDocuments({ status: "active" }),
      Application.countDocuments(),
      Application.countDocuments({ status: "Selected" }),
      Interview.countDocuments(),
      Job.countDocuments({ status: "pending" }),
      User.countDocuments({ role: "recruiter", approved: false }),
      Report.countDocuments({ status: "open" }),
    ]);

  const [appsOverTime, jobsByType, studentsByBranch, topCompanies] = await Promise.all([
    Application.aggregate([
      { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$appliedAt" } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
      { $limit: 12 },
    ]),
    Job.aggregate([{ $group: { _id: "$jobType", count: { $sum: 1 } } }]),
    StudentProfile.aggregate([{ $match: { branch: { $ne: null, $ne: "" } } }, { $group: { _id: "$branch", count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
    Job.aggregate([
      { $group: { _id: "$companyId", jobs: { $sum: 1 } } },
      { $lookup: { from: "companies", localField: "_id", foreignField: "_id", as: "company" } },
      { $unwind: "$company" },
      { $project: { name: "$company.name", logo: "$company.logo", jobs: 1 } },
      { $sort: { jobs: -1 } },
      { $limit: 8 },
    ]),
  ]);

  const placementsOverTime = await Application.aggregate([
    { $match: { status: "Selected" } },
    { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$updatedAt" } }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
    { $limit: 12 },
  ]);

  const placementRate = totalStudents > 0 ? Math.round((totalPlacements / totalStudents) * 100) : 0;

  res.json({
    success: true,
    statistics: {
      counts: {
        totalStudents, totalRecruiters, totalCompanies, totalJobs, activeJobs,
        totalApplications, totalPlacements, totalInterviews, pendingJobs, pendingRecruiters, openReports, placementRate,
      },
      charts: {
        appsOverTime: appsOverTime.map((x) => ({ month: x._id, count: x.count })),
        placementsOverTime: placementsOverTime.map((x) => ({ month: x._id, count: x.count })),
        jobsByType: jobsByType.map((x) => ({ type: x._id, count: x.count })),
        studentsByBranch: studentsByBranch.map((x) => ({ branch: x._id, count: x.count })),
        topCompanies,
      },
    },
  });
});

// ── USERS (students/recruiters) ─────────────────────────────
const listUsers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query, { defaultLimit: 15 });
  const filter = {};
  if (req.query.role && req.query.role !== "all") filter.role = req.query.role;
  const q = cleanStr(req.query.q);
  if (q) filter.$or = [{ name: new RegExp(escapeRegex(q), "i") }, { email: new RegExp(escapeRegex(q), "i") }];

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).select("-password").lean(),
    User.countDocuments(filter),
  ]);

  res.json({ success: true, users, ...buildPageMeta(total, { page, limit }) });
});

// PUT /api/admin/users/:id/toggle-active
const toggleUserActive = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound("User not found");
  if (user.role === "admin") throw ApiError.forbidden("Cannot deactivate an admin");
  user.isActive = !user.isActive;
  await user.save();
  res.json({ success: true, user: user.toJSON() });
});

// PUT /api/admin/recruiters/:id/approve
const approveRecruiter = asyncHandler(async (req, res) => {
  const { approve } = req.body; // true | false
  const user = await User.findById(req.params.id);
  if (!user || user.role !== "recruiter") throw ApiError.notFound("Recruiter not found");

  user.approved = Boolean(approve);
  if (approve) user.isVerified = true;
  await user.save();

  await notify({
    userId: user._id,
    title: approve ? "Account approved ✅" : "Account rejected ❌",
    message: approve
      ? "Your recruiter account has been approved. You can now post jobs and manage applicants."
      : "Your recruiter account approval was rejected. Contact the placement cell for details.",
    type: "system",
    link: "/recruiter",
  });

  res.json({ success: true, user: user.toJSON() });
});

// ── COMPANIES ───────────────────────────────────────────────
const listCompanies = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query, { defaultLimit: 15 });
  const q = cleanStr(req.query.q);
  const filter = q ? { name: new RegExp(escapeRegex(q), "i") } : {};

  const [companies, total] = await Promise.all([
    Company.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Company.countDocuments(filter),
  ]);
  res.json({ success: true, companies, ...buildPageMeta(total, { page, limit }) });
});

const verifyCompany = asyncHandler(async (req, res) => {
  const company = await Company.findById(req.params.id);
  if (!company) throw ApiError.notFound("Company not found");
  company.verified = !company.verified;
  await company.save();
  res.json({ success: true, company });
});

// ── JOBS: approve / reject ─────────────────────────────────
const listAllJobs = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query, { defaultLimit: 15 });
  const filter = {};
  if (req.query.status && req.query.status !== "all") filter.status = req.query.status;
  const q = cleanStr(req.query.q);
  if (q) filter.title = new RegExp(escapeRegex(q), "i");

  const [jobs, total] = await Promise.all([
    Job.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate("companyId", "name logo").lean(),
    Job.countDocuments(filter),
  ]);
  res.json({ success: true, jobs, ...buildPageMeta(total, { page, limit }) });
});

const moderateJob = asyncHandler(async (req, res) => {
  const { action, reason } = req.body; // approve | reject | close
  const job = await Job.findById(req.params.id).populate("companyId", "name");
  if (!job) throw ApiError.notFound("Job not found");

  if (action === "approve") {
    job.status = "active";
    job.rejectionReason = undefined;
  } else if (action === "reject") {
    job.status = "rejected";
    job.rejectionReason = reason || "Does not meet platform guidelines";
  } else if (action === "close") {
    job.status = "closed";
  } else {
    throw ApiError.badRequest("Invalid action");
  }
  await job.save();

  await notify({
    userId: job.recruiterId,
    title: action === "approve" ? "Job posting approved ✅" : `Job posting ${action === "reject" ? "rejected" : "closed"}`,
    message:
      action === "approve"
        ? `Your job "${job.title}" at ${job.companyId.name} is now live.`
        : `Your job "${job.title}" was ${action === "reject" ? "rejected" : "closed"}. ${job.rejectionReason || ""}`,
    type: "system",
    link: "/recruiter/jobs",
  });

  res.json({ success: true, job });
});

// ── APPLICATIONS (read-only oversight) ──────────────────────
const listAllApplications = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query, { defaultLimit: 15 });
  const filter = {};
  if (req.query.status && req.query.status !== "all") filter.status = req.query.status;

  const [applications, total] = await Promise.all([
    Application.find(filter)
      .sort({ appliedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({ path: "studentId", select: "name email" })
      .populate({ path: "jobId", select: "title" })
      .populate({ path: "companyId", select: "name" })
      .lean(),
    Application.countDocuments(filter),
  ]);
  res.json({ success: true, applications, ...buildPageMeta(total, { page, limit }) });
});

// ── REPORTS ────────────────────────────────────────────────
const listReports = asyncHandler(async (req, res) => {
  const filter = req.query.status && req.query.status !== "all" ? { status: req.query.status } : {};
  const reports = await Report.find(filter)
    .sort({ createdAt: -1 })
    .limit(100)
    .populate("reporterId", "name email role");
  res.json({ success: true, reports });
});

const resolveReport = asyncHandler(async (req, res) => {
  const { status, resolutionNote } = req.body; // resolved | dismissed
  if (!["resolved", "dismissed"].includes(status)) throw ApiError.badRequest("Invalid status");
  const report = await Report.findById(req.params.id);
  if (!report) throw ApiError.notFound("Report not found");
  report.status = status;
  report.resolutionNote = resolutionNote || "";
  report.resolvedBy = req.user._id;
  await report.save();
  res.json({ success: true, report });
});

module.exports = {
  statistics, listUsers, toggleUserActive, approveRecruiter,
  listCompanies, verifyCompany, listAllJobs, moderateJob,
  listAllApplications, listReports, resolveReport,
};
