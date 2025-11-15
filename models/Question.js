// dekho ye file sirf Question.js jo frontend mein hai uske liye schema ke liye hai ok or kisi ke liye nahi isse sirf store hote hai
const mongoose = require("mongoose");

// ✅ Single Question schema (frontend Question.js ke liye)
const questionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true, // frontend se token/userId ke saath aayega
    },
    question: {
      type: String,
      required: [true, "Question text is required"],
      trim: true,
    },
    options: {
      type: [String],
      default: [],
      validate: [arr => Array.isArray(arr), "Options should be an array"],
    },
    correctAnswer: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, "Answer is required"],
    },
    type: {
      type: String,
      enum: ["MCQ", "FullAnswer", "TrueFalse"],
      default: "MCQ",
    },
    explanation: {
      type: String,
      default: "",
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Question", questionSchema);
