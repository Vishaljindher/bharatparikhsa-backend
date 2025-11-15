const ForPublicTest = require("../models/forpublictest.js");
const generateQuestionsFromText = require("../utils/aiQuestionGenerator.js");

// ✅ Extract text into questions
const extractQuestions = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: "Text is required" });

    const questions = generateQuestionsFromText(text);

    res.status(200).json({
      message: "Questions extracted successfully",
      data: { questions },
    });
  } catch (error) {
    console.error("❌ Extraction error:", error);
    res.status(500).json({ message: "Error extracting questions" });
  }
};

// ✅ Save extracted questions directly into ForPublicTest model
const saveExtracted = async (req, res) => {
  try {
    const { questions, title, description, isPublic } = req.body;
    const user = req.user;

    if (!questions || !questions.length) {
      return res.status(400).json({ message: "No questions provided" });
    }

    // 🧠 Convert extracted questions into proper test question format
    const formattedQuestions = questions.map((q) => ({
      question: q.question,
      type: q.type || "text", // can be mcq/text
      options: q.options || [],
      answer: q.answer || "",
      difficulty: "easy",
    }));

    // 🧠 Create new test directly in ForPublicTest
    const test = await ForPublicTest.create({
      title: title || "Extracted Test",
      description: description || "Created from extracted questions",
      visibility: isPublic ? "public" : "private",
      createdBy: user ? user._id : "673XXXXdummyUserId", // add user from token or dummy
      questions: formattedQuestions,
    });

    res.status(201).json({
      message: "✅ Test created successfully from extracted questions",
      test,
    });
  } catch (error) {
    console.error("❌ Save error:", error);
    res.status(500).json({ message: "Error creating test from extracted questions" });
  }
};

module.exports = { extractQuestions, saveExtracted };
