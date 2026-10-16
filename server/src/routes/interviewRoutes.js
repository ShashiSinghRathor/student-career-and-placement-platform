const router = require("express").Router();
const { protect, authorize } = require("../middleware/auth");
const c = require("../controllers/interviewController");
const { interviewRules, mongoIdParam, checkValidation, body } = require("../middleware/validate");
const appCtrl = require("../controllers/applicationController");

router.use(protect);

// shared list (student sees own, recruiter sees own)
router.get("/", authorize("student", "recruiter", "admin"), appCtrl.listInterviews);
router.get("/me", authorize("student"), c.myInterviews);

router.post("/", authorize("recruiter", "admin"), interviewRules, checkValidation, c.createInterview);
router.put("/:id", authorize("recruiter", "admin"), mongoIdParam, checkValidation, c.updateInterview);

module.exports = router;
