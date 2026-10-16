const router = require("express").Router();
const c = require("../controllers/authController");
const { checkValidation, registerRules, loginRules, emailOnly, resetRules } = require("../middleware/validate");

router.post("/register", registerRules, checkValidation, c.register);
router.post("/login", loginRules, checkValidation, c.login);
router.post("/forgot-password", emailOnly, checkValidation, c.forgotPassword);
router.post("/reset-password/:token", resetRules, checkValidation, c.resetPassword);

const { protect } = require("../middleware/auth");
router.get("/me", protect, c.me);
router.put("/update-me", protect, c.updateMe);
router.put("/password", protect, c.changePassword);
router.post("/logout", protect, c.logout);

module.exports = router;
