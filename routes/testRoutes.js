const express = require("express");
const TestResult = require("../models/TestResult.js");
const Test = require("../models/forpublictest.js"); // ✅ Your test model
const { protect } = require("../middleware/authMiddleware.js");
const { loadTest } = require("../middleware/loadTest.js");
const { canViewTest } = require("../middleware/canViewTest.js");
const jwt = require("jsonwebtoken");

const router = express.Router();

/**
 * ✅ Save Test Result (Private)
 */
router.post("/save", protect, async (req, res) => {
  const { testId, testName, score, total } = req.body;
  try {
    if (!testName || score == null || total == null) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const result = await TestResult.create({
      userId: req.user._id,
      testId,
      testName,
      score,
      total,
      date: new Date(),
    });

    res.status(201).json({ message: "✅ Test result saved successfully", result });
  } catch (error) {
    console.error("Error saving test result:", error.message);
    res.status(500).json({ message: "❌ Error saving test result", error: error.message });
  }
});

/**
 * ✅ Get All Results for Logged-in User
 */
router.get("/my-results", protect, async (req, res) => {
  try {
    const results = await TestResult.find({ userId: req.user._id }).sort({ date: -1 });
    res.json(results);
  } catch (error) {
    console.error("Error fetching results:", error.message);
    res.status(500).json({ message: "❌ Error fetching results", error: error.message });
  }
});

/**
 * ✅ Create New Test (Private)
 */
router.post("/create", protect, async (req, res) => {
  try {
    const { title, description, questions, visibility } = req.body;

    if (!title || !questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ message: "Title and at least one question are required" });
    }

    const newTest = await Test.create({
      title,
      description: description || "",
      questions,
      visibility: visibility || "private",
      createdBy: req.user._id,
    });

    res.status(201).json({ message: "✅ Test created successfully", test: newTest });
  } catch (error) {
    console.error("Error creating test:", error.message);
    res.status(500).json({ message: "❌ Error creating test", error: error.message });
  }
});

/**
 * ✅ Get Tests Created by Logged-in User
 */
router.get("/my-tests", protect, async (req, res) => {
  try {
    const tests = await Test.find({ createdBy: req.user._id }).sort({ createdAt: -1 });
    res.json(tests); // ✅ You forgot this line earlier!
  } catch (error) {
    console.error("Error fetching user tests:", error.message);
    res.status(500).json({ message: "❌ Error fetching your tests", error: error.message });
  }
});

/**
 * ✅ Get Public Tests (For Everyone)
 */
router.get("/public-tests", async (req, res) => {
  try {
    const publicTests = await Test.find({ visibility: "public" }).sort({ createdAt: -1 });
    res.json(publicTests);
  } catch (error) {
    console.error("Error fetching public tests:", error.message);
    res.status(500).json({ message: "❌ Error fetching public tests", error: error.message });
  }
});

/**
 * ✅ Get All Available Tests (Public + User’s Private)
 */
router.get("/available", async (req, res) => {
  try {
    let userId = null;

    // ✅ Optional login: decode JWT manually
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      const token = req.headers.authorization.split(" ")[1];
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.id;
      } catch {}
    }

    // ✅ If logged in → show public + their private
    let tests;
    if (userId) {
      tests = await Test.find({
        $or: [{ visibility: "public" }, { createdBy: userId }],
      }).sort({ createdAt: -1 });
    } else {
      tests = await Test.find({ visibility: "public" }).sort({ createdAt: -1 });
    }

    res.json(tests);
  } catch (error) {
    console.error("Error fetching available tests:", error.message);
    res.status(500).json({ message: "❌ Error fetching tests", error: error.message });
  }
});

/**
 * ✅ Get Specific Test by ID (Uses Middleware)
 */
router.get("/:id", protect, loadTest, canViewTest, async (req, res) => {
  try {
    res.json(req.test);
  } catch (error) {
    console.error("Error fetching test:", error.message);
    res.status(500).json({ message: "❌ Error fetching test", error: error.message });
  }
});

/**
 * 🗑 Delete a Test (Only Creator)
 */
router.delete("/:id", protect, async (req, res) => {
  try {
    const test = await Test.findById(req.params.id);

    if (!test) return res.status(404).json({ message: "Test not found" });

    if (test.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this test" });
    }

    await test.deleteOne();
    res.json({ message: "✅ Test deleted successfully" });
  } catch (error) {
    console.error("Error deleting test:", error.message);
    res.status(500).json({ message: "❌ Error deleting test", error: error.message });
  }
});

module.exports = router;
