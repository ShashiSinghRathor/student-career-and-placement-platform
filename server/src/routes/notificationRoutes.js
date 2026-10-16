const router = require("express").Router();
const { protect } = require("../middleware/auth");
const c = require("../controllers/notificationController");

router.use(protect);
router.get("/", c.list);
router.put("/read-all", c.markAllRead);
router.put("/:id/read", c.markRead);

module.exports = router;
