const router = require("express").Router();
const { protect, authorize } = require("../middleware/auth");
const a = require("../controllers/adminController");
const upload = require("../middleware/upload");

router.use(protect, authorize("admin"));

router.get("/statistics", a.statistics);

router.get("/users", a.listUsers);
router.put("/users/:id/toggle-active", a.toggleUserActive);
router.put("/recruiters/:id/approve", a.approveRecruiter);

router.get("/companies", a.listCompanies);
router.put("/companies/:id/verify", a.verifyCompany);

router.get("/jobs", a.listAllJobs);
router.put("/jobs/:id/moderate", a.moderateJob);

router.get("/applications", a.listAllApplications);

router.get("/reports", a.listReports);
router.put("/reports/:id/resolve", a.resolveReport);

module.exports = router;
