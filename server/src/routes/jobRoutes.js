const router = require("express").Router();
const { protect, authorize } = require("../middleware/auth");
const c = require("../controllers/jobController");
const { applicationRules, checkValidation, mongoIdParam } = require("../middleware/validate");
const { uploadResumeMiddleware } = require("../middleware/upload");

// Public
router.get("/", c.listJobs);
router.get("/:id", c.getJob);

// Authenticated
router.use(protect);

// Recruiter
router.post("/", authorize("recruiter"), c.createJob);
router.put("/:id", authorize("recruiter", "admin"), c.updateJob);
router.delete("/:id", authorize("recruiter", "admin"), c.deleteJob);
router.get("/my/posted", authorize("recruiter"), c.myPostedJobs);
router.get("/:id/applicants", authorize("recruiter", "admin"), listApplicantsGuard, c.listApplicants);

// Student
router.post(
  "/:id/apply",
  authorize("student"),
  applicationRules,
  checkValidation,
  uploadResumeMiddleware,
  c.applyToJob
);

function listApplicantsGuard(req, res, next) {
  next();
}

module.exports = router;
