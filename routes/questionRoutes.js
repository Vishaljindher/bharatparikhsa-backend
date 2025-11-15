const express = require("express");
const router = express.Router();
const Question = require("../models/Question");
const { protect } = require("../middleware/authMiddleware");

// 📍 Add a single Question
router.post("/", protect, async (req, res) => {
  try {
    const { question, type, options, correctAnswer, explanation } = req.body;

    if (!question || !type || !correctAnswer) {
      return res.status(400).json({
        message: "Question, type, and correctAnswer are required",
      });
    }

    if (type.toLowerCase() === "MCQ" && (!options || !Array.isArray(options))) {
      return res
        .status(400)
        .json({ message: "Options must be an array for MCQs" });
    }

    const newQuestion = new Question({
      userId: req.user._id,
      question,
      type,
      options,
      correctAnswer,
      explanation,
    });

    await newQuestion.save();

    res
      .status(201)
      .json({ message: "✅ Question saved", question: newQuestion.toObject() });
  } catch (err) {
    console.error("❌ Error saving question:", err);
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((val) => val.message);
      return res.status(400).json({ message: messages.join(", ") });
    }
    res.status(500).json({ message: "Server Error" });
  }
});


// 🔹 NEW — Save Multiple or AI-Extracted Questions (Enhanced)
router.post("/bulk", protect, async (req, res) => {
  try {
    let { questions, text } = req.body;

    // 🧠 CASE 1: If frontend sends text (raw AI output)
    if (text && typeof text === "string" && (!questions || questions.length === 0)) {
      // Split by lines or question markers like Q. or ?
      const lines = text.split(/\n|\r/).filter((l) => l.trim());
      questions = [];

      let currentQ = null;
      for (const line of lines) {
        const lower = line.trim().toLowerCase();
        if (lower.startsWith("q") || lower.includes("?")) {
          if (currentQ) questions.push(currentQ);
          currentQ = { question: line.trim(), correctAnswer: "Not provided" };
        } else if (lower.startsWith("a")) {
          if (currentQ) currentQ.correctAnswer = line.replace(/^A[:\-\s]*/i, "").trim();
        }
      }
      if (currentQ) questions.push(currentQ);
    }

    // 🧠 CASE 2: If questions array provided
    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({
        message: "Questions array or text input is required",
      });
    }

    // Normalize structure
    const formatted = questions.map((q) => ({
      userId: req.user._id,
      question: q.question || q.Q || "",
      type: q.type || "MCQ",
      options: q.options || [],
      correctAnswer: q.correctAnswer || q.answer || q.A || "Not provided",
      explanation: q.explanation || "",
    }));

    // 🧩 Remove duplicates by question text for the same user
    const unique = [];
    const seen = new Set();
    for (const q of formatted) {
      const key = `${req.user._id}-${q.question.trim().toLowerCase()}`;
      if (!seen.has(key)) {
        unique.push(q);
        seen.add(key);
      }
    }

    if (unique.length === 0) {
      return res.status(400).json({ message: "No unique questions to save" });
    }

    const saved = await Question.insertMany(unique);

    res.status(201).json({
      message: `✅ ${saved.length} Questions saved successfully`,
      totalReceived: questions.length,
      uniqueSaved: saved.length,
      skippedDuplicates: questions.length - saved.length,
      questions: saved,
    });
  } catch (err) {
    console.error("❌ Error in /bulk:", err);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
});


// 📍 Get all Questions of a user
router.get("/", protect, async (req, res) => {
  try {
    const questions = await Question.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    res.json(questions);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err.message });
  }
});


// 📍 Get single Question by ID
router.get("/:id", protect, async (req, res) => {
  try {
    const question = await Question.findOne({
      _id: req.params.id,
      userId: req.user._id,
    }).lean();

    if (!question)
      return res.status(404).json({ message: "Question not found" });

    res.json(question);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});


// 📍 Update a Question
router.put("/:id", protect, async (req, res) => {
  try {
    const { question, type, options, correctAnswer, explanation } = req.body;

    const updated = await Question.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { question, type, options, correctAnswer, explanation },
      { new: true, runValidators: true }
    );

    if (!updated)
      return res.status(404).json({ message: "Question not found" });

    res.json({
      message: "✅ Question updated successfully",
      question: updated.toObject(),
    });
  } catch (err) {
    console.error("❌ Update error:", err);
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((val) => val.message);
      return res.status(400).json({ message: messages.join(", ") });
    }
    res.status(500).json({ message: "Server Error" });
  }
});


// 📍 Delete a Question
router.delete("/:id", protect, async (req, res) => {
  try {
    const deleted = await Question.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!deleted)
      return res.status(404).json({ message: "Question not found" });

    res.json({
      message: "🗑️ Question deleted successfully",
      question: deleted.toObject(),
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
