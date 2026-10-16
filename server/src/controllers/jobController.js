const mongoose = require("mongoose");
const Job = require("../models/Job");
const Company = require("../models/Company");
const Application = require("../models/Application");
const SavedJob = require("../models/SavedJob");
const { parsePagination, buildPageMeta } = require("../utils/pagination");
const { escapeRegex, cleanStr } = require("../utils/normalize");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { notify } = require("../services/notificationService");
const { computeMatch } = require("../services/matchingService");
const StudentProfile = require("../models/StudentProfile");

// GET /api/jobs — public & authenticated search with filters, sort, pagination
const listJobs = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query, { defaultLimit: 12 });

  const filters = { status: "active" };
  const q = cleanStr(req.query.q);

  if (q) {
    const rx = new RegExp(escapeRegex(q), "i");
    const companies = await Company.find({ name: rx }).select("_id");
    filters.$or = [
      { title: rx },
      { description: rx },
      { requiredSkills: rx },
      { location: rx },
      { companyId: { $in: companies.map((c) => c._id) } },
    ];
  }

  if (req.query.location) filters.location = new RegExp(escapeRegex(req.query.location), "i");
  if (req.query.type) filters.jobType = req.query.type; // internship | full-time | part-time | contract
  if (req.query.mode) filters.mode = req.query.mode;
  if (req.query.experience) filters.experience = req.query.experience;
  if (req.query.companyId) filters.companyId = req.query.companyId;
  if (req.query.branch && req.query.branch !== "all") filters["eligibility.allowedBranches"] = req.query.branch;

  const minSalary = Number(req.query.minSalary) || 0;
  if (minSalary > 0) filters["salary.max"] = { $gte: minSalary };

  if (req.query.skills) {
    const skills = cleanStr(req.query.skills).split(",").map((s) => new RegExp(escapeRegex(s.trim()), "i")).filter(Boolean);
    if (skills.length) filters.requiredSkills = { $in: skills };
  }

  const deadlined = req.query.hideExpired !== "false";
  if (deadlined) filters.deadline = { $gt: new Date() };

  const sortMap = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    deadline: { deadline: 1 },
    salary: { "salary.max": -1 },
  };
  const sort = sortMap[req.query.sort] || sortMap.newest;

  const [jobs, total] = await Promise.all([
    Job.find(filters)
      .populate("companyId", "name logo industry location")
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean({ virtuals: true }),
    Job.countDocuments(filters),
  ]);

  // personalize: attach student skill-match + saved/applied flags
  let extras = { saved: new Set(), applied: new Set(), matchScores: {} };
  if (req.user?.role === "student") {
    const [studentProfile, saved, applied] = await Promise.all([
      StudentProfile.findOne({ userId: req.user._id }).select("skills").lean(),
      SavedJob.find({ studentId: req.user._id }).select("jobId").lean(),
      Application.find({ studentId: req.user._id }).select("jobId").lean(),
    ]);
    extras.saved = new Set(saved.map((s) => s.jobId.toString()));
    extras.applied = new Set(applied.map((a) => a.jobId.toString()));
    jobs.forEach((job) => {
      extras.matchScores[job._id] = computeMatch(studentProfile?.skills, job.requiredSkills);
    });
  }

  const items = jobs.map((job) => ({
    ...job,
    applicantCount: undefined,
    saved: extras.saved.has(job._id.toString()),
    applied: extras.applied.has(job._id.toString()),
    matchPercent: extras.matchScores[job._id] ?? undefined,
  }));

  res.json({ success: true, jobs: items, ...buildPageMeta(total, { page, limit }) });
});

// GET /api/jobs/:id
const getJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id).populate("companyId", "name logo description website industry location size");
  if (!job) throw ApiError.notFound("Job not found");

  await Job.updateOne({ _id: job._id }, { $inc: { views: 1 } });

  let payload = job.toJSON();
  if (req.user?.role === "student") {
    const [saved, applied, profile] = await Promise.all([
      SavedJob.findOne({ studentId: req.user._id, jobId: job._id }),
      Application.findOne({ studentId: req.user._id, jobId: job._id }).select("status"),
      StudentProfile.findOne({ userId: req.user._id }).select("skills cgpa branch graduationYear").lean(),
    ]);
    payload.saved = Boolean(saved);
    payload.applied = Boolean(applied);
    payload.appliedStatus = applied?.status || null;
    payload.matchPercent = computeMatch(profile?.skills, job.requiredSkills);
  }

  res.json({ success: true, job: payload });
});

// POST /api/jobs — recruiter (or admin) posts; goes to "active" if company verified else pending
const createJob = asyncHandler(async (req, res) => {
  const {
    title, description, responsibilities, requirements, jobType, mode, location,
    salary, durationMonths, openings, requiredSkills, eligibility, experience, deadline,
  } = req.body;

  const RecruiterProfile = require("../models/RecruiterProfile");
  const rec = await RecruiterProfile.findOne({ userId: req.user._id });
  if (!rec?.companyId) throw ApiError.badRequest("Create your company profile before posting jobs");

  const company = await Company.findById(rec.companyId);
  if (!company) throw ApiError.notFound("Company not found");

  const job = await Job.create({
    companyId: company._id,
    recruiterId: req.user._id,
    title, description, responsibilities, requirements, jobType, mode, location,
    salary, durationMonths, openings, requiredSkills, eligibility, experience,
    deadline: new Date(deadline),
    status: company.verified ? "active" : "pending",
  });

  // Notify students whose skills overlap — max 200 to avoid flooding
  if (job.status === "active" && (requiredSkills || []).length) {
    const rx = requiredSkills.slice(0, 5).map((s) => new RegExp(escapeRegex(String(s)), "i"));
    const StudentProfile = require("../models/StudentProfile");
    const students = await StudentProfile.find({ skills: { $in: rx } })
      .limit(200)
      .select("userId");
    if (students.length) {
      await notify({
        userIds: students.map((s) => s.userId),
        title: `New ${job.title} at ${company.name}`,
        message: `A new job matching your skills has been posted: ${job.title} (${job.location}).`,
        type: "job",
        link: `/jobs/${job._id}`,
      });
    }
  }

  res.status(201).json({ success: true, job });
});

// PUT /api/jobs/:id — recruiter owns it (admin override)
const updateJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) throw ApiError.notFound("Job not found");

  if (job.recruiterId.toString() !== req.user._id.toString() && req.user.role !== "admin") {
    throw ApiError.forbidden("You can only edit your own job postings");
  }

  const updatable = [
    "title", "description", "responsibilities", "requirements", "jobType", "mode", "location",
    "salary", "durationMonths", "openings", "requiredSkills", "eligibility", "experience", "status", "deadline",
  ];
  updatable.forEach((k) => {
    if (req.body[k] !== undefined) job[k] = k === "deadline" ? new Date(req.body[k]) : req.body[k];
  });
  await job.save();
  res.json({ success: true, job });
});

// DELETE /api/jobs/:id
const deleteJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) throw ApiError.notFound("Job not found");
  if (job.recruiterId.toString() !== req.user._id.toString() && req.user.role !== "admin") {
    throw ApiError.forbidden("You can only delete your own job postings");
  }
  await Promise.all([
    Application.deleteMany({ jobId: job._id }),
    SavedJob.deleteMany({ jobId: job._id }),
    Job.deleteOne({ _id: job._id }),
  ]);
  res.json({ success: true, message: "Job and related applications removed" });
});

// GET /api/jobs/my/posted — recruiter dashboard list
const myPostedJobs = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query, { defaultLimit: 10 });
  const filter = { recruiterId: req.user._id };
  if (req.query.status) filter.status = req.query.status;

  const [jobs, total] = await Promise.all([
    Job.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Job.countDocuments(filter),
  ]);

  const jobIds = jobs.map((j) => j._id);
  const counts = await Application.aggregate([
    { $match: { jobId: { $in: jobIds } } },
    { $group: { _id: { jobId: "$jobId", status: "$status" }, n: { $sum: 1 } } },
  ]);
  const byJob = {};
  counts.forEach(({ _id, n }) => {
    byJob[_id.jobId] = byJob[_id.jobId] || {};
    byJob[_id.jobId][_id.status] = n;
  });

  const items = jobs.map((j) => {
    const st = byJob[j._id] || {};
    return {
      ...j,
      stats: {
        applications: Object.values(st).reduce((a, b) => a + b, 0),
        shortlisted: st["Shortlisted"] || 0,
        interviews: st["Interview Scheduled"] || 0,
        selected: st["Selected"] || 0,
      },
    };
  });

  res.json({ success: true, jobs: items, ...buildPageMeta(total, { page, limit }) });
});

// GET /api/jobs/:id/applicants — recruiter views applicants for job
const listApplicants = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id).select("recruiterId title companyId");
  if (!job) throw ApiError.notFound("Job not found");
  if (job.recruiterId.toString() !== req.user._id.toString() && req.user.role !== "admin") {
    throw ApiError.forbidden("Not your job posting");
  }

  const { page, limit, skip } = parsePagination(req.query, { defaultLimit: 15 });
  const filter = { jobId: job._id };
  if (req.query.status && req.query.status !== "all") filter.status = req.query.status;

  const [applications, total] = await Promise.all([
    Application.find(filter)
      .sort({ appliedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({ path: "studentId", select: "name email profileImage" })
      .populate({
        path: "studentId",
        populate: { path: "studentProfileRef", model: "StudentProfile" },
      })
      .lean(),
    Application.countDocuments(filter),
  ]);

  // attach student profiles manually
  const StudentProfile = require("../models/StudentProfile");
  const profiles = await StudentProfile.find({
    userId: { $in: applications.map((a) => a.studentId?._id || a.studentId) },
  }).lean();
  const pm = {};
  profiles.forEach((p) => (pm[p.userId.toString()] = p));

  const items = applications.map((a) => {
    const sid = (a.studentId?._id || a.studentId).toString();
    return { ...a, studentProfile: pm[sid] || null };
  });

  res.json({ success: true, applications: items, job, ...buildPageMeta(total, { page, limit }) });
});

module.exports = { listJobs, getJob, createJob, updateJob, deleteJob, myPostedJobs, listApplicants };
