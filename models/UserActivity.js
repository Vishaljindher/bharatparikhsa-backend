// backend/models/UserActivity.js

const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema({
  title: String,
  timeSpent: Number,      // minutes
  category: String,
  timestamp: { type: Date, default: Date.now },
});

const dailyLogSchema = new mongoose.Schema({
  date: { type: String, required: true },   // YYYY-MM-DD
  activities: [activitySchema],
  notes: { type: String, default: "" },
  mood: { type: String, default: "" },
  productivity: { type: Number, default: 0 }, // 1–10 scale
});

const userActivitySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", unique: true },

  activeDays: { type: [String], default: [] },     // ["2025-11-14"]
  currentStreak: { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 },
  lastActiveDate: { type: String, default: null },

  dailyLogs: [dailyLogSchema], // full activity logs
});

module.exports = mongoose.model("UserActivity", userActivitySchema);
