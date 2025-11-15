console.log("✅ testTypeRoutes file loaded successfully");
const express = require("express");
const router = express.Router();
const ForPublicTest = require("../models/forpublictest.js");
const {
  getPracticeTest,
  getTimedTest,
  getExamTest,
  getAdaptiveTest,
} = require("../controller/testTypeController.js");

// 🧠 Helper function (for internal filtering)
function getTestType(title = "") {
  const lower = title.toLowerCase();
  if (lower.includes("practice")) return "practice";
  if (lower.includes("timed")) return "timed";
  if (lower.includes("exam")) return "exam";
  if (lower.includes("adaptive")) return "adaptive";
  return "unknown";
}

// 👉 Create a new test
router.post("/", async (req, res) => {
  try {
    const newTest = new ForPublicTest(req.body);
    await newTest.save();
    res
      .status(201)
      .json({ message: "✅ Test created successfully", test: newTest });
  } catch (err) {
    console.error("❌ Error creating test:", err.message);
    res.status(400).json({ message: err.message });
  }
});

// 🧠 Fetch all tests (for listing)
router.get("/", async (req, res) => {
  try {
    const tests = await ForPublicTest.find();
    res.json(tests);
  } catch (err) {
    res.status(500).json({ message: "Error fetching tests" });
  }
});

// 🎯 Fetch test by ID (raw test data)
router.get("/id/:id", async (req, res) => {
  try {
    const test = await ForPublicTest.findById(req.params.id);
    if (!test) return res.status(404).json({ message: "Test not found" });
    res.json(test);
  } catch (err) {
    res.status(500).json({ message: "Error fetching test" });
  }
});

// 🎯 Fetch tests directly from DB by 'type' field
// 🎯 Fetch tests directly from DB by 'type' field
router.get("/type/:type", async (req, res) => {
  try {
    const { type } = req.params;
    const fixedType = type.toLowerCase();  // NEW FIX

    const regex = new RegExp(fixedType, "i");

    // NEW: check if user wants only public tests
    const visibility = req.query.visibility;  // <--

    // NEW: dynamic filter
    let filter = {
      $or: [
        { type: fixedType },
        { title: { $regex: regex } },
      ],
    };

    // NEW: if user is logged out
    if (visibility === "public") {
      filter.visibility = "public"; // <--
    }

    const tests = await ForPublicTest.find(filter);

    if (!tests.length) {
      return res.status(404).json({ message: `No ${fixedType} tests found` });
    }

    res.status(200).json(tests);
  } catch (err) {
    console.error("❌ Error fetching tests by type:", err.message);
    res.status(500).json({
      message: "Error fetching tests by type",
      error: err.message,
    });
  }
});





// 🧩 Test mode routes
router.get("/practice/:id", getPracticeTest);
router.get("/timed/:id", getTimedTest);
router.get("/exam/:id", getExamTest);
router.get("/adaptive/:id", getAdaptiveTest);

module.exports = router;
