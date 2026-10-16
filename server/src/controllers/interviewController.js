const Application = require("../models/Application");
const Interview = require("../models/Interview");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { notify } = require("../services/notificationService");

// POST /api/interviews — recruiter schedules interview for an application
const createInterview = asyncHandler(async (req, res) => {
  const { applicationId, date, time, type, meetingLink, location, interviewer, notes, round } = req.body;

  const application = await Application.findById(applicationId).populate("jobId", "title");
  if (!application) throw ApiError.notFound("Application not found");

  if (application.recruiterId.toString() !== req.user._id.toString() && req.user.role !== "admin") {
    throw ApiError.forbidden("Not your application");
  }

  const when = new Date(date);
  if (isNaN(when.getTime())) throw ApiError.badRequest("Invalid date");

  const interview = await Interview.create({
    applicationId,
    studentId: application.studentId,
    recruiterId: req.user._id,
    round: round || "Technical Round 1",
    date: when,
    time,
    type,
    meetingLink,
    location,
    interviewer,
    notes,
    status: "Scheduled",
  });

  // Move application to "Interview Scheduled" if it isn't already past that stage
  if (!["Interview Scheduled", "Selected"].includes(application.status)) {
    application.status = "Interview Scheduled";
    application.history.push({ status: "Interview Scheduled", note: `Interview scheduled (${round || "Round 1"})`, at: new Date() });
    await application.save();
  }

  application.scheduledInterviews = application.scheduledInterviews || [];
  application.scheduledInterviews.push(interview._id);
  await application.save();

  const scheduleDate = when.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  await notify({
    userId: application.studentId,
    title: "Interview scheduled 📅",
    message: `Your interview for ${application.jobId.title} has been scheduled for ${scheduleDate} at ${time}.`,
    type: "interview",
    link: `/applications/${application._id}`,
    meta: { interviewId: interview._id },
  });

  res.status(201).json({ success: true, interview });
});

// PUT /api/interviews/:id — reschedule / update / cancel
const updateInterview = asyncHandler(async (req, res) => {
  const interview = await Interview.findById(req.params.id).populate({
    path: "applicationId",
    select: "jobId studentId",
    populate: { path: "jobId", select: "title" },
  });
  if (!interview) throw ApiError.notFound("Interview not found");

  const allowed = interview.recruiterId.toString() === req.user._id.toString() || req.user.role === "admin";
  if (!allowed) throw ApiError.forbidden("Not your interview");

  ["date", "time", "type", "meetingLink", "location", "interviewer", "notes", "round", "status"].forEach((k) => {
    if (req.body[k] !== undefined) interview[k] = k === "date" ? new Date(req.body[k]) : req.body[k];
  });
  await interview.save();

  await notify({
    userId: interview.studentId,
    title: interview.status === "Cancelled" ? "Interview cancelled" : "Interview updated ⏰",
    message:
      interview.status === "Cancelled"
        ? `Your interview for ${interview.applicationId.jobId.title} has been cancelled.`
        : `Your interview for ${interview.applicationId.jobId.title} is now on ${interview.date.toLocaleDateString()} at ${interview.time}.`,
    type: "interview",
    link: `/applications/${interview.applicationId._id}`,
    meta: { interviewId: interview._id },
  });

  res.json({ success: true, interview });
});

// GET /api/interviews/me (student) — auto shares logic with applicationController.listInterviews
const myInterviews = asyncHandler(async (req, res) => {
  const filter = { studentId: req.user._id };
  const interviews = await Interview.find(filter)
    .sort({ date: 1 })
    .populate({ path: "applicationId", select: "status", populate: { path: "jobId", select: "title", populate: { path: "companyId", select: "name logo" } } });
  res.json({ success: true, interviews });
});

module.exports = { createInterview, updateInterview, myInterviews };
