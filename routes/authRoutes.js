const express = require("express");
const {
  register,
  login,
  getDailyUserRegistrations,
  requestOtpLogin,
  verifyOtpLogin,
} = require("../controllers/authController");
const { authMiddleware } = require("../middleware/authMiddleware");
const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/getDailyUserRegistrations",authMiddleware, getDailyUserRegistrations);
router.post("/request-otp", requestOtpLogin);
router.post("/verify-otp", verifyOtpLogin);
module.exports = router;
