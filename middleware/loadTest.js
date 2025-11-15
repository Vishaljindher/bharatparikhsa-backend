const mongoose = require("mongoose");
const Test = require("../models/forpublictest.js");

// ✅ Middleware: Test ko DB se load karta hai
const loadTest = async (req, res, next) => {
  try {
    const testId = req.params.id;

    if (!testId) {
      return res.status(400).json({ message: "Test ID is required" });
    }

    // ✅ Check if it's a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(testId)) {
      return res.status(400).json({ message: "Invalid test ID format" });
    }

    // ✅ Fetch test from DB
    const test = await Test.findById(testId).populate("createdBy", "name email");

    if (!test) {
      return res.status(404).json({ message: "Test not found" });
    }

    // ✅ Store test in request object for next middlewares/controllers
    req.test = test;
    next();
  } catch (error) {
    console.error("Error in loadTest middleware:", error);
    res.status(500).json({ message: "Server error while loading test" });
  }
};

module.exports = { loadTest };
