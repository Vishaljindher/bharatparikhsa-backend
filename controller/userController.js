const User = require("../models/User.js");
const bcrypt = require("bcryptjs");
const generateToken = require("../utils/generateToken.js");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

// ===============================
// 🔧 Mail Transporter
// ===============================
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// ===============================
// 📍 REGISTER USER (OTP BASED)
// ===============================
const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const existingUser = await User.findOne({ email });

    // 🚫 Already verified
    if (existingUser && existingUser.isVerified) {
      return res.status(400).json({ message: "User already exists" });
    }

    // 🔁 OTP already sent & valid
    if (existingUser && existingUser.otpExpire > Date.now()) {
      return res.status(400).json({
        message: "OTP already sent. Please verify your email.",
      });
    }

    // 🧹 Old unverified user cleanup
    if (existingUser) {
      await User.deleteOne({ email });
    }

    // 🔐 Password Hash
    const hashedPassword = await bcrypt.hash(password, 10);

    // 🔢 OTP Generate
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    // 📦 Create User with OTP
    const user = await User.create({
  name,
  email,
  password: hashedPassword,
  otp: otp,                 // ✅ PLAIN OTP
  otpExpire: Date.now() + 10 * 60 * 1000,
  isVerified: false,
});

    console.log("🔹 OTP (DEV):", otp);

    // 📧 Send Email (SAFE BLOCK)
    try {
      await transporter.sendMail({
        from: `"Quiz App" <eboys938@gmail.com>`,
        to: user.email,
        subject: "Email Verification OTP",
        html: `
          <h2>Hello ${user.name}</h2>
          <p>Your OTP is:</p>
          <h1>${otp}</h1>
          <p>Expires in 10 minutes</p>
        `,
      });
    } catch (mailError) {
      console.error("❌ Email Failed:", mailError.message);

      // 🔥 ROLLBACK (VERY IMPORTANT)
      await User.deleteOne({ _id: user._id });

      return res.status(500).json({
        message: "Failed to send OTP email. Please try again.",
      });
    }

    return res.status(201).json({
      message: "OTP sent successfully. Please verify your email.",
    });
  } catch (error) {
    console.error("❌ Register Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// ===============================
// 📍 VERIFY OTP
// ===============================
const verifyOTP = async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: "Email and OTP are required" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.otpExpire < Date.now()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    const isMatch = await bcrypt.compare(otp, user.otp);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    user.isVerified = true;
    user.otp = null;
    user.otpExpire = null;
    await user.save();

    return res.status(200).json({ message: "Email verified successfully" });
  } catch (error) {
    console.error("❌ Verify OTP Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// ===============================
// 📍 LOGIN USER
// ===============================
const loginController = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    if (!user.isVerified) {
      return res.status(400).json({ message: "Please verify your email" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    return res.json({
      message: "Login successful",
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

// ===============================
// 📍 FORGOT PASSWORD
// ===============================
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
      from: `"Quiz App" <no-reply@quizapp.com>`,
      to: user.email,
      subject: "Password Reset",
      html: `<a href="${resetURL}">Reset Password</a>`,
    });

    res.json({ message: "Password reset link sent" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// ===============================
// 📍 RESET PASSWORD
// ===============================
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
    res.status(500).json({ message: "Server error" });
  }
};

// ===============================
// 📍 PROGRESS
// ===============================
const saveProgress = async (req, res) => {
  try {
    const user = await User.findById(req.body.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.progress.push(req.body);
    await user.save();

    res.json({ message: "Progress saved" });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
};

const getProgress = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ progress: user.progress });
  } catch {
    res.status(500).json({ message: "Server error" });
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
