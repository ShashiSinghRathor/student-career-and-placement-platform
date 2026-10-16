const router = require("express").Router();
const { protect, authorize } = require("../middleware/auth");
const c = require("../controllers/savedJobController");
const { mongoIdParam, checkValidation } = require("../middleware/validate");

router.use(protect, authorize("student"));
router.get("/", c.list);
router.post("/:jobId/toggle", mongoIdParam, checkValidation, c.toggle);

module.exports = router;
