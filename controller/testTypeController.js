const ForPublicTest = require("../models/forpublictest.js");

// 🧠 Practice Test — no timer, instant feedback
const getPracticeTest = async (req, res) => {
  try {
    const test = await ForPublicTest.findById(req.params.id);
    if (!test) return res.status(404).json({ message: "Test not found" });

    res.json({
      ...test.toObject(),
      mode: "practice",
      timer: false,
      showAnswersInstantly: true,
    });
  } catch (err) {
    res.status(500).json({ message: "Error fetching practice test" });
  }
};

// ⏱ Timed Test — limited time
const getTimedTest = async (req, res) => {
  try {
    const test = await ForPublicTest.findById(req.params.id);
    if (!test) return res.status(404).json({ message: "Test not found" });

    res.json({
      ...test.toObject(),
      mode: "timed",
      timer: true,
      duration: test.timeLimit || (60 * test.questions.length), // e.g. 1 min per question
    });
  } catch (err) {
    res.status(500).json({ message: "Error fetching timed test" });
  }
};

// 🚫 Exam Mode — no hints, no retries
const getExamTest = async (req, res) => {
  try {
    const test = await ForPublicTest.findById(req.params.id);
    if (!test) return res.status(404).json({ message: "Test not found" });

    res.json({
      ...test.toObject(),
      mode: "exam",
      timer: true,
      allowRetry: false,
      showAnswersAfterSubmit: true,
    });
  } catch (err) {
    res.status(500).json({ message: "Error fetching exam test" });
  }
};

// 🧩 Adaptive Mode — difficulty adjusts dynamically
const getAdaptiveTest = async (req, res) => {
  try {
    const test = await ForPublicTest.findById(req.params.id);
    if (!test) return res.status(404).json({ message: "Test not found" });

    const sortedQuestions = test.questions.sort((a, b) => {
      const difficulty = { easy: 1, medium: 2, hard: 3 };
      return difficulty[a.difficulty] - difficulty[b.difficulty];
    });

    res.json({
      ...test.toObject(),
      mode: "adaptive",
      adaptive: true,
      questions: sortedQuestions,
    });
  } catch (err) {
    res.status(500).json({ message: "Error fetching adaptive test" });
  }
};

module.exports = {
  getPracticeTest,
  getTimedTest,
  getExamTest,
  getAdaptiveTest,
};
