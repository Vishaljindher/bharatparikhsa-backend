const User = require("../models/User.js");
const bcrypt = require("bcryptjs");
const generateToken = require("../utils/generateToken.js");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

// 🔧 Create reusable mail transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_PORT == 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// 📍 Register User (Send OTP)
// 📍 Register User (Send OTP)
const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const existingUser = await User.findOne({ email });

    // ✅ Check if user exists but not verified
    if (existingUser) {
      if (existingUser.isVerified) {
        return res.status(400).json({ message: "User already exists and verified" });
      } else {
        // ✅ Check OTP expiry — agar expire ho gaya to delete old record
        if (existingUser.otpExpire < Date.now()) {
          await User.deleteOne({ email });
        } else {
          return res.status(400).json({
            message: "OTP already sent. Please verify your email before registering again.",
          });
        }
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // 🔹 Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log("🔹 Generated OTP for testing:", otp);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      otp,
      otpExpire: Date.now() + 10 * 60 * 1000, // 10 minutes expiry
      isVerified: false,
    });

    // 🔹 Send OTP Email
    await transporter.sendMail({
      from: `"Quiz App" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: "Email Verification OTP - Quiz App",
      html: `
        <h2>Hello, ${user.name}!</h2>
        <p>Your OTP for email verification is:</p>
        <h1 style="color:#007bff;">${otp}</h1>
        <p>This OTP will expire in <b>10 minutes</b>.</p>
      `,
    });

    res.status(201).json({
      message: "OTP sent to your email. Please verify to complete registration.",
      userId: user._id,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


// 📍 Verify OTP
const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    console.log("🧩 Stored OTP:", user.otp);
    console.log("🧩 Received OTP:", otp);

    // ✅ Compare hashed OTP with plain OTP
    const isMatch = await bcrypt.compare(otp, user.otp);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    user.isVerified = true;
    user.otp = null;
    await user.save();

    return res.status(200).json({ message: "Email verified successfully!" });
  } catch (error) {
    console.error("❌ OTP Verification Error:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};



// 📍 Login User (only if verified)
const loginController = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    if (!user.isVerified) {
      return res.status(400).json({ message: "Please verify your email before logging in" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    res.json({
      message: "Login successful",
      user: { id: user._id, name: user.name, email: user.email },
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// 📍 Forgot Password (same as before)
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    const resetToken = crypto.randomBytes(20).toString("hex");
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
    await user.save();

    const resetURL = `${req.protocol}://${req.get("host")}/api/users/reset-password/${resetToken}`;

    await transporter.sendMail({
      from: `"Quiz App" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: "Password Reset - Quiz App",
      html: `
        <h2>Password Reset Request</h2>
        <p>Click below to reset your password:</p>
        <a href="${resetURL}" 
           style="background:#28a745;color:white;padding:10px 20px;border-radius:5px;text-decoration:none;">
           Reset Password
        </a>
        <p>This link will expire in 10 minutes.</p>
      `,
    });

    res.json({ message: "Password reset link sent to your email." });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// 📍 Reset Password
const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) return res.status(400).json({ message: "Invalid or expired token" });

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({ message: "Password reset successful" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// 📍 Save Progress
const saveProgress = async (req, res) => {
  const { userId, testName, score, accuracy, answers } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.progress.push({ testName, score, accuracy, answers });
    await user.save();

    res.json({ message: "Progress saved successfully", progress: user.progress });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// 📍 Get Progress
const getProgress = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ progress: user.progress });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  registerUser,
  verifyOTP,
  loginController,
  forgotPassword,
  resetPassword,
  saveProgress,
  getProgress,
};
