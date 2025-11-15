// ✅ routes/createtestroute.js
const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const ForPublicTest = require("../models/forpublictest.js");

// ✅ Import controller functions
const {
  createTest,
  getMyTests,
  getPublicTests,
  getTestById,
  updateTest,
  deleteTest,
} = require("../controller/testController.js");

const { protect } = require("../middleware/authMiddleware.js");

// 🟢 Create a new test (public/private depending on isPublic)
router.post("/create", protect, createTest);

// 🟢 Get all tests created by logged-in user
router.get("/mytests", protect, getMyTests);

// 🟢 Get all public tests (available for everyone)
router.get("/public", getPublicTests);

// ✅ Get all tests for logged-in user (public + private)
router.get("/all", protect, async (req, res) => {
  try {
    const userId = req.user.id;

    // ✅ Fetch both public tests + user's own tests
    const tests = await ForPublicTest.find({
      $or: [
        { visibility: "public" },
        { createdBy: userId },
      ],
    })
      .populate("createdBy", "name email _id") // 🔥 THIS IS THE KEY
      .sort({ createdAt: -1 });

    // ✅ Log to verify populate is working
    console.log("✅ Populated tests:", tests.map(t => t.createdBy));

    res.json(tests);
  } catch (error) {
    console.error("❌ Error fetching all tests:", error.message);
    res.status(500).json({ message: "Server error while fetching all tests" });
  }
});




// 🟢 Get a single test by ID
router.get("/test/:id", protect, getTestById);

// 🟢 Update a test by ID (only for creator)
router.put("/test/:id", protect, updateTest);

// 🟢 Delete a test by ID (only for creator)
router.delete("/test/:id", protect, deleteTest);

// 🟢 Submit answers for a specific test
router.post("/submit/:id", protect, async (req, res) => {
  try {
    const testId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(testId)) {
      return res.status(400).json({ message: "Invalid Test ID format" });
    }

    const { answers } = req.body;
    if (!answers) {
      return res.status(400).json({ message: "Answers are required" });
    }

    const test = await ForPublicTest.findById(testId);
    if (!test) return res.status(404).json({ message: "Test not found" });

    let score = 0;
    const total = test.questions.length;

    test.questions.forEach((q) => {
      const questionId = q._id.toString();
      const userAnswer = answers[questionId];

      if (
        userAnswer &&
        q.answer &&
        userAnswer.toString().trim().toLowerCase() ===
        q.answer.toString().trim().toLowerCase()
      ) {
        score++;
      }
    });

    res.json({
      message: "✅ Test submitted successfully",
      score,
      total,
    });
  } catch (error) {
    console.error("❌ Error submitting test:", error.message);
    res.status(500).json({
      message: "Server error while submitting test",
      error: error.message,
    });
  }
});

// ✅ Export Router
module.exports = router;
