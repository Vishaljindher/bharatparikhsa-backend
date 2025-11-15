const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// 🔹 Sub-schema for user quiz/test progress
const answerSchema = new mongoose.Schema({
  questionId: { type: String },
  selectedOption: { type: String },
  isCorrect: { type: Boolean },
});

const progressSchema = new mongoose.Schema({
  testName: { type: String, required: true }, // e.g., "Python Basics Quiz"
  score: { type: Number, default: 0 },
  accuracy: { type: Number, default: 0 },
  answers: [answerSchema],
  completedAt: { type: Date, default: Date.now },
});

// 🔹 Main User Schema
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email address",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
    },

    // 📩 Email OTP Verification Fields
    isVerified: { type: Boolean, default: false },
    otp: { type: String }, // Hashed OTP stored
    otpExpire: { type: Date }, // OTP expiration time

    // 🔑 Reset Password Fields
    resetPasswordToken: { type: String },
    resetPasswordExpire: { type: Date },

    // 📊 User Progress Tracking
    progress: [progressSchema],

    // 👤 Optional fields
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    avatar: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// 🔹 Hash OTP before saving (if modified)
userSchema.pre("save", async function (next) {
  if (this.isModified("otp") && this.otp) {
    const salt = await bcrypt.genSalt(10);
    this.otp = await bcrypt.hash(this.otp, salt);
  }
  next();
});

// 🔹 Compare entered OTP with hashed OTP
userSchema.methods.matchOTP = async function (enteredOTP) {
  return await bcrypt.compare(enteredOTP, this.otp);
};

// 🔹 Clear OTP after verification
userSchema.methods.clearOTP = function () {
  this.otp = undefined;
  this.otpExpire = undefined;
};

module.exports = mongoose.model("User", userSchema);
