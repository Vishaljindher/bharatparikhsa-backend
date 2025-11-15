const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware.js");

const {
  markTodayActive,
  addActivity,
  getDailyActivities,
  addNote,
  autoSync,  // <-- MUST BE ADDED
} = require("../controller/userActivityController.js");

// Auto-sync (page load)
router.get("/auto-sync", protect, autoSync);

// Streak
router.post("/mark-today", protect, markTodayActive);

// Activity add
router.post("/add", protect, addActivity);

// Get daily logs
router.get("/daily/:userId/:date", getDailyActivities);

// Add note
router.post("/note", protect, addNote);

module.exports = router;
