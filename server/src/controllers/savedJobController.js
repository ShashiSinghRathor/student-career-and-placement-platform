const SavedJob = require("../models/SavedJob");
const Job = require("../models/Job");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");

// POST /api/saved-jobs/:jobId/toggle
const toggle = asyncHandler(async (req, res) => {
  const jobId = req.params.jobId;
  const job = await Job.findById(jobId);
  if (!job) throw ApiError.notFound("Job not found");

  const existing = await SavedJob.findOne({ studentId: req.user._id, jobId });
  if (existing) {
    await existing.deleteOne();
    return res.json({ success: true, saved: false, message: "Removed from saved jobs" });
  }
  await SavedJob.create({ studentId: req.user._id, jobId });
  res.status(201).json({ success: true, saved: true, message: "Job saved" });
});

// GET /api/saved-jobs
const list = asyncHandler(async (req, res) => {
  const saved = await SavedJob.find({ studentId: req.user._id }).sort({ createdAt: -1 });
  const jobs = await Job.find({ _id: { $in: saved.map((s) => s.jobId) } })
    .populate("companyId", "name logo location industry")
    .lean();

  // preserve save order
  const orderMap = {};
  saved.forEach((s, i) => (orderMap[s.jobId.toString()] = i));
  jobs.sort((a, b) => orderMap[a._id.toString()] - orderMap[b._id.toString()]);

  res.json({ success: true, savedJobs: jobs.map((j) => ({ ...j, saved: true })) });
});

module.exports = { toggle, list };
