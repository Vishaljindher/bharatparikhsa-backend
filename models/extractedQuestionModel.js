const ExtractedQuestion = require("../models/extractedQuestionModel");
const ForPublicTest = require("../models/forpublictest.js");
const generateQuestionsFromText = require("../utils/aiQuestionGenerator.js");

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

// ✅ UPDATED FUNCTION
const saveExtracted = async (req, res) => {
  try {
    const { questions, title, description, isPublic } = req.body;
    const user = req.user; // available if user is logged in

    if (!questions || !questions.length)
      return res.status(400).json({ message: "No questions provided" });

    // 1️⃣ Save extracted questions for backup
    const savedExtracted = await ExtractedQuestion.create({
      textSource: "Manual Submit",
      questions,
    });

    // 2️⃣ Prepare question format for test
    const formattedQuestions = questions.map((q) => ({
      question: q.question,
      type: q.type || "mcq",
      options: q.options || [],
      answer: q.answer,
    }));

    // 3️⃣ Create a new Test in main test system
    const test = await ForPublicTest.create({
      title: title || "Extracted Test",
      description: description || "Created from extracted questions",
      visibility: isPublic ? "public" : "private",
      createdBy: user ? user._id : null,
      questions: formattedQuestions,
    });

    res.status(200).json({
      message: "✅ Questions saved and Test created successfully!",
      extracted: savedExtracted,
      test,
    });
  } catch (error) {
    console.error("❌ Save error:", error);
    res.status(500).json({ message: "Error saving questions" });
  }
};

module.exports = { extractQuestions, saveExtracted };
