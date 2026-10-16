const Application = require("../models/Application");
const Job = require("../models/Job");
const Interview = require("../models/Interview");
const StudentProfile = require("../models/StudentProfile");
const { parsePagination, buildPageMeta } = require("../utils/pagination");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { notify } = require("../services/notificationService");
const { sendEmail } = require("../services/emailService");

const STATUS_FLOW = ["Applied", "Under Review", "Shortlisted", "Interview Scheduled", "Selected"];

// POST /api/jobs/:id/apply
const applyToJob = asyncHandler(async (req, res) => {
  const jobId = req.params.id;
  const job = await Job.findOne({ _id: jobId, status: "active" });
  if (!job) throw ApiError.notFound("Job not found or no longer accepting applications");

  if (job.deadline < new Date()) throw ApiError.badRequest("Application deadline has passed");

  const dup = await Application.findOne({ studentId: req.user._id, jobId });
  if (dup) throw ApiError.conflict("You have already applied to this job");

  const profile = await StudentProfile.findOne({ userId: req.user._id });
  if (!profile) throw ApiError.notFound("Complete your student profile first");
  if (profile.completionPercent() < 40) {
    throw ApiError.badRequest("Complete at least 40% of your profile before applying");
  }

  const resumeUrl = req.file?.url || profile.resumeUrl || req.body.resumeUrl;
  if (!resumeUrl) {
    throw ApiError.badRequest("Upload a resume or add one to your profile first");
  }

  const application = await Application.create({
    studentId: req.user._id,
    jobId,
    recruiterId: job.recruiterId,
    companyId: job.companyId,
    resumeUrl,
    coverLetter: req.body.coverLetter || "",
    status: "Applied",
    history: [{ status: "Applied", note: "Application submitted", at: new Date() }],
  });

  await notify({
    userId: job.recruiterId,
    title: `New application received`,
    message: `${req.user.name} applied for ${job.title}`,
    type: "application",
    link: `/recruiter/applicants/${jobId}`,
    meta: { applicationId: application._id },
  });

  await sendEmail({
    to: req.user.email,
    subject: `Application submitted – ${job.title}`,
    text: `Hi ${req.user.name}, your application for ${job.title} has been submitted successfully. Track it in My Applications.`,
  });

  res.status(201).json({ success: true, application, message: "Application submitted successfully" });
});

// GET /api/applications (student's own)
const myApplications = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query, { defaultLimit: 10 });
  const filter = { studentId: req.user._id };
  if (req.query.status && req.query.status !== "all") filter.status = req.query.status;

  const [applications, total] = await Promise.all([
    Application.find(filter)
      .sort({ appliedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({ path: "jobId", select: "title jobType location salary deadline requiredSkills", populate: { path: "companyId", select: "name logo" } })
      .lean(),
    Application.countDocuments(filter),
  ]);

  const interviewMap = {};
  if (applications.length) {
    const ivs = await Interview.find({ applicationId: { $in: applications.map((a) => a._id) } }).lean();
    ivs.forEach((iv) => {
      interviewMap[iv.applicationId] = interviewMap[iv.applicationId] || [];
      interviewMap[iv.applicationId].push(iv);
    });
  }

  const items = applications.map((a) => ({ ...a, interviews: interviewMap[a._id] || [] }));
  res.json({ success: true, applications: items, ...buildPageMeta(total, { page, limit }) });
});

// GET /api/applications/:id
const getApplication = asyncHandler(async (req, res) => {
  const app = await Application.findById(req.params.id)
    .populate({ path: "jobId", populate: { path: "companyId", select: "name logo website location" } })
    .populate({ path: "studentId", select: "name email profileImage" });

  if (!app) throw ApiError.notFound("Application not found");
  const isOwner = app.studentId._id.toString() === req.user._id.toString();
  const isRecruiter = app.recruiterId?.toString() === req.user._id.toString();
  if (!isOwner && !isRecruiter && req.user.role !== "admin") {
    throw ApiError.forbidden("You don't have access to this application");
  }

  let studentProfile = null;
  if (isRecruiter || req.user.role === "admin") {
    studentProfile = await StudentProfile.findOne({ userId: app.studentId._id }).lean();
  }

  const interviews = await Interview.find({ applicationId: app._id }).sort({ date: 1 });

  res.json({ success: true, application: { ...app.toJSON(), interviews, studentProfile } });
});

// PUT /api/applications/:id/status — recruiter (or admin)
const updateStatus = asyncHandler(async (req, res) => {
  const app = await Application.findById(req.params.id).populate("jobId", "title");
  if (!app) throw ApiError.notFound("Application not found");

  const isRecruiter = app.recruiterId?.toString() === req.user._id.toString();
  if (!isRecruiter && req.user.role !== "admin") {
    throw ApiError.forbidden("Only the posting recruiter can update application status");
  }

  const { status, note } = req.body;
  const valid = ["Applied", "Under Review", "Shortlisted", "Interview Scheduled", "Selected", "Rejected"];
  if (!valid.includes(status)) throw ApiError.badRequest("Invalid status");

  if (app.status === "Selected" && status !== "Selected") {
    throw ApiError.badRequest("Cannot move a selected candidate back to an earlier stage");
  }
  app.status = status;
  app.history.push({ status, note, at: new Date() });
  app.updatedAt = new Date();
  await app.save();

  await notify({
    userId: app.studentId,
    title: status === "Rejected" ? "Application update" : "Great news! 🎉",
    message:
      status === "Rejected"
        ? `Your application for ${app.jobId.title} was not selected this time. Keep going — more opportunities await!`
        : `Your application for ${app.jobId.title} has been moved to "${status}".`,
    type: "application",
    link: `/applications/${app._id}`,
    meta: { applicationId: app._id, status },
  });

  const student = await require("../models/User").findById(app.studentId);
  if (student) {
    await sendEmail({
      to: student.email,
      subject: `[CareerConnect] ${jobTitleOf(app)} – status: ${status}`,
      text: `Hi ${student.name}, the status of your application for ${jobTitleOf(app)} is now "${status}".`,
    });
  }

  res.json({ success: true, application: app });
});

function jobTitleOf(app) {
  return app.jobId?.title || "a job";
}

// GET /api/applications/students/:studentId (recruiter view of a particular student's apps)
const studentApplications = asyncHandler(async (req, res) => {
  if (req.user.role !== "admin") throw ApiError.forbidden("Admin only");
  const apps = await Application.find({ studentId: req.params.studentId })
    .populate("jobId", "title jobType");
  res.json({ success: true, applications: apps });
});

// GET /api/recruiter/interviews
const listInterviews = asyncHandler(async (req, res) => {
  const filter = req.user.role === "student" ? { studentId: req.user._id } : { recruiterId: req.user._id };
  const interviews = await Interview.find(filter)
    .sort({ date: 1 })
    .populate({
      path: "applicationId",
      select: "status studentId jobId",
      populate: { path: "jobId", select: "title" },
    });
  res.json({ success: true, interviews });
});

module.exports = { applyToJob, myApplications, getApplication, updateStatus, studentApplications, listInterviews };
