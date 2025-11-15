// backend/controllers/userActivityController.js

const UserActivity = require("../models/UserActivity.js");
const { getToday, isYesterday } = require("../utils/dateUtils.js");


// ----------------------------------------------------
// INTERNAL FUNCTION → auto mark today active
// ----------------------------------------------------
const markTodayActiveInternal = async (userId) => {
  const today = getToday();
  let ua = await UserActivity.findOne({ userId });

  // First time user
  if (!ua) {
    ua = await UserActivity.create({
      userId,
      activeDays: [today],
      currentStreak: 1,
      longestStreak: 1,
      lastActiveDate: today,
      dailyLogs: [],
    });

    return ua;
  }

  // Already marked today? Then skip changes
  if (ua.activeDays.includes(today)) {
    return ua;
  }

  // Else: Mark today active
  ua.activeDays.push(today);

  if (isYesterday(today, ua.lastActiveDate)) {
    ua.currentStreak += 1;
  } else {
    ua.currentStreak = 1;
  }

  if (ua.currentStreak > ua.longestStreak) {
    ua.longestStreak = ua.currentStreak;
  }

  ua.lastActiveDate = today;
  await ua.save();

  return ua;
};


// ----------------------------------------------------
// AUTO-SYNC ENDPOINT (CALL THIS ON PAGE LOAD) 
// ----------------------------------------------------
exports.autoSync = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = getToday();

    // 1️⃣ Auto mark streak
    let ua = await markTodayActiveInternal(userId);

    // 2️⃣ Auto create today's log if missing
    let todayLog = ua.dailyLogs.find((d) => d.date === today);

    if (!todayLog) {
      todayLog = {
        date: today,
        activities: [],
        notes: "",
        mood: "",
        productivity: 0,
      };
      ua.dailyLogs.push(todayLog);
      await ua.save();
    }

    // 3️⃣ Return combined data
    return res.json({
      message: "Auto-sync complete",
      streak: {
        current: ua.currentStreak,
        longest: ua.longestStreak,
      },
      log: todayLog,
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// ----------------------------------------------------
// MANUAL → MARK TODAY ACTIVE 
// ----------------------------------------------------
exports.markTodayActive = async (req, res) => {
  try {
    const userId = req.user.id;

    const ua = await markTodayActiveInternal(userId);

    return res.json({
      message: "Today marked active",
      currentStreak: ua.currentStreak,
      longestStreak: ua.longestStreak,
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// ----------------------------------------------------
// ADD ACTIVITY (Manual)
// ----------------------------------------------------
exports.addActivity = async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, timeSpent, category } = req.body;
    const today = getToday();

    let ua = await UserActivity.findOne({ userId });
    if (!ua) ua = await UserActivity.create({ userId });

    let log = ua.dailyLogs.find((d) => d.date === today);

    // Create today's log if missing
    if (!log) {
      log = {
        date: today,
        activities: [],
        notes: "",
        mood: "",
        productivity: 0,
      };
      ua.dailyLogs.push(log);
    }

    // Add activity
    log.activities.push({ title, timeSpent, category });
    await ua.save();

    res.json({ message: "Activity added", log });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// ----------------------------------------------------
// GET DAILY ACTIVITIES
// ----------------------------------------------------
exports.getDailyActivities = async (req, res) => {
  try {
    const { userId, date } = req.params;

    const ua = await UserActivity.findOne({ userId });
    if (!ua) return res.json({ activities: [] });

    const log = ua.dailyLogs.find((d) => d.date === date);

    return res.json(log || { activities: [] });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// ----------------------------------------------------
// ADD NOTE
// ----------------------------------------------------
exports.addNote = async (req, res) => {
  try {
    const userId = req.user.id;
    const { note } = req.body;
    const today = getToday();

    let ua = await UserActivity.findOne({ userId });
    if (!ua) ua = await UserActivity.create({ userId });

    let log = ua.dailyLogs.find((d) => d.date === today);

    // Create log if missing
    if (!log) {
      log = {
        date: today,
        activities: [],
        notes: note,
        mood: "",
        productivity: 0,
      };
      ua.dailyLogs.push(log);
    } else {
      log.notes = note;
    }

    await ua.save();
    res.json({ message: "Note added", log });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
