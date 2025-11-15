// controllers/testController.js

const ForPublicTest = require("../models/forpublictest.js");

// ✅ Create a new test (only for logged-in users)
const createTest = async (req, res) => {
  try {
    const { title, description, visibility, isPublic, questions, timeLimit, type } = req.body;


    if (!title || !questions || questions.length === 0) {
      return res
        .status(400)
        .json({ message: "Title and questions are required." });
    }

    const formattedQuestions = questions.map((q) => ({
      question: q.question,
      type: q.type || "mcq",
      options: q.options || [],
      answer: q.answer,
    }));
    const finalVisibility = visibility || (isPublic ? "public" : "private");
    const test = await ForPublicTest.create({
      title,
      description,
      visibility: finalVisibility,
      timeLimit: timeLimit || null,
      type: type || "practice",
      createdBy: req.user._id,
      questions: formattedQuestions,
    });

    res.status(201).json({
      message: "✅ Test created successfully",
      test,
    });
  } catch (error) {
    console.error("❌ Error creating test:", error);
    res.status(500).json({ message: "Server error while creating test." });
  }
};

// ✅ Get tests created by logged-in user
const getMyTests = async (req, res) => {
  try {
    const tests = await ForPublicTest.find({ createdBy: req.user._id })
      .populate("createdBy", "name email _id")
      .sort({ createdAt: -1 });

    res.status(200).json(tests);
  } catch (error) {
    console.error("❌ Error fetching user's tests:", error);
    res.status(500).json({ message: "Server error while fetching tests." });
  }
};


// ✅ Get all public tests (accessible without login)
const getPublicTests = async (req, res) => {
  try {
    const tests = await ForPublicTest.find({ visibility: "public" })
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json(tests);
  } catch (error) {
    console.error("❌ Error fetching public tests:", error);
    res
      .status(500)
      .json({ message: "Server error while fetching public tests." });
  }
};

// ✅ Get test by ID (public or private if owner)
const getTestById = async (req, res) => {
  try {
    const testId = req.params.id;

    // 🧠 agar 'all' bheja ho frontend se, to saare public test bhej do
    if (testId === "all") {
      const tests = await ForPublicTest.find({ visibility: "public" }).sort({
        createdAt: -1,
      });
      return res.json(tests);
    }

    const test = await ForPublicTest.findById(testId);

    if (!test) {
      return res.status(404).json({ message: "Test not found" });
    }

    // 🧠 Agar private test hai to check karo user owner hai ya nahi
    if (
      test.visibility === "private" &&
      (!req.user || test.createdBy.toString() !== req.user._id.toString())
    ) {
      return res.status(403).json({ message: "Not authorized to view this test" });
    }

    res.json(test);
  } catch (error) {
    console.error("❌ Error fetching test by ID:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Update a test
const updateTest = async (req, res) => {
  try {
    const testId = req.params.id;
    const { title, description, isPublic, questions, timeLimit, type } = req.body;


    const test = await ForPublicTest.findById(testId);
    if (!test) {
      return res.status(404).json({ message: "Test not found." });
    }

    if (test.createdBy.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this test." });
    }

    test.title = title || test.title;
    test.description = description || test.description;
    test.visibility = isPublic ? "public" : "private";
    test.timeLimit = timeLimit ?? test.timeLimit;
    test.type = type ?? test.type;


    if (questions && questions.length > 0) {
      test.questions = questions.map((q) => ({
        question: q.question,
        type: q.type || "mcq",
        options: q.options || [],
        answer: q.answer,
      }));
    }

    const updatedTest = await test.save();
    res.status(200).json({
      message: "✅ Test updated successfully",
      updatedTest,
    });
  } catch (error) {
    console.error("❌ Error updating test:", error);
    res.status(500).json({ message: "Server error while updating test." });
  }
};

// ✅ Delete a test
const deleteTest = async (req, res) => {
  try {
    const testId = req.params.id;
    const test = await ForPublicTest.findById(testId);

    if (!test) {
      return res.status(404).json({ message: "Test not found." });
    }

    if (test.createdBy.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this test." });
    }

    await test.deleteOne();
    res.status(200).json({ message: "🗑️ Test deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting test:", error);
    res.status(500).json({ message: "Server error while deleting test." });
  }
};

// ✅ Export all controllers
module.exports = {
  createTest,
  getMyTests,
  getPublicTests,
  getTestById,
  updateTest,
  deleteTest,
};

