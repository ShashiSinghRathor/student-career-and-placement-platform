const router = require("express").Router();
const { protect, authorize } = require("../middleware/auth");
const rc = require("../controllers/recruiterController");

router.use(protect, authorize("recruiter"));

router.get("/dashboard", rc.dashboard);
router.get("/company", rc.getCompany);
router.post("/company", rc.createCompany);
router.put("/company", rc.updateCompany);

module.exports = router;
