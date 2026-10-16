const router = require("express").Router();
const { protect, authorize } = require("../middleware/auth");
const c = require("../controllers/studentController");
const StudentProfile = require("../models/StudentProfile");
const asyncHandler = require("../utils/asyncHandler");
const { recommendJobs } = require("../services/matchingService");

router.use(protect, authorize("student"));

router.get("/profile", c.getMyProfile);
router.put("/profile", c.updateProfile);
router.delete("/profile/:array/:itemId", c.deleteArrayItem);
router.get("/dashboard", c.dashboard);
router.get("/analytics", c.analytics);

// GET /api/students/recommendations — skill match based
router.get(
  "/recommendations",
  asyncHandler(async (req, res) => {
    const profile = await StudentProfile.findOne({ userId: req.user._id });
    const result = await recommendJobs(profile || { skills: [] }, {
      page: parseInt(req.query.page, 10) || 1,
      limit: parseInt(req.query.limit, 10) || 8,
    });
    res.json({ success: true, ...result });
  })
);

module.exports = router;
