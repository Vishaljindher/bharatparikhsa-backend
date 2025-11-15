const express = require("express");
const {
  registerUser,
  loginController,
  forgotPassword,
  resetPassword,
  saveProgress,
  getProgress,
  verifyEmail,
  verifyOTP, // ✅ Add this line
} = require("../controller/userController.js");

const { protect } = require("../middleware/authMiddleware.js");

const router = express.Router();

// ==========================
// 🔐 AUTHENTICATION ROUTES
// ==========================

// ✅ Register (with Email Verification)
router.post("/register", registerUser);

// ✅ Login (with Verification Check)
router.post("/login", loginController);

// ✅ Get User Profile (Protected)
router.get("/profile", protect, (req, res) => {
  res.json({
    message: "User profile fetched successfully",
    user: req.user,
  });
});

// ==========================
// 📩 EMAIL VERIFICATION ROUTE
// ==========================
router.post("/verify-otp", verifyOTP);

// ==========================
// 🔑 PASSWORD RESET ROUTES
// ==========================

// ✅ Request Reset Link
router.post("/forgot-password", forgotPassword);

// ✅ Reset Password with Token
router.post("/reset-password/:token", resetPassword);

// ==========================
// 📊 USER PROGRESS ROUTES
// ==========================

// ✅ Save Quiz/Test Progress
router.post("/progress", protect, saveProgress);

// ✅ Get All Progress for a User
router.get("/progress/:userId", protect, getProgress);

// ==========================
// 🚀 EXPORT ROUTER
// ==========================
module.exports = router;
