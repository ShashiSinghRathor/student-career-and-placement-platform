const router = require("express").Router();
const { protect, authorize } = require("../middleware/auth");
const c = require("../controllers/applicationController");
const { mongoIdParam, checkValidation } = require("../middleware/validate");

router.use(protect);

router.get("/", c.myApplications);                    // student's own
router.get("/:id", mongoIdParam, checkValidation, c.getApplication);
router.put("/:id/status", mongoIdParam, checkValidation, c.updateStatus);

module.exports = router;
