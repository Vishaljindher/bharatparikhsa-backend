const mongoose = require("mongoose");

// ✅ Reusable schema for individual questions (MCQ, Text, True/False)
const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
    trim: true,
  },

  // type: 'mcq' | 'text' | 'truefalse'
  type: {
    type: String,
    enum: ["mcq", "text", "truefalse"],
    default: "mcq",
  },

  // options required for MCQ; optional/ignored for text; optional for truefalse
  options: {
    type: [String],
    validate: {
      validator: function (arr) {
        // If MCQ: must have >=2 non-empty options
        if (this.type === "mcq") {
          return (
            Array.isArray(arr) &&
            arr.length >= 2 &&
            arr.every((s) => typeof s === "string" && s.trim() !== "")
          );
        }
        // For truefalse or text: allow missing or empty options
        return true;
      },
      message: "MCQ questions must have at least two non-empty options.",
    },
    default: undefined,
  },

  // answer should always be provided (for truefalse should be 'True' or 'False')
  answer: {
    type: String,
    required: true,
    trim: true,
  },

  // (Optional) difficulty for adaptive mode
  difficulty: {
    type: String,
    enum: ["easy", "medium", "hard"],
    default: "medium",
  },
});

// ✅ Test Schema
const testSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Test title is required."],
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    visibility: {
      type: String,
      enum: ["public", "private"],
      default: "private",
    },

    // 🧠 Test Type (Practice, Timed, Exam, Adaptive)
    type: {
      type: String,
      enum: ["practice", "timed", "exam", "adaptive"],
      default: "practice", // ✅ Prevents old data errors
    },

    // ⏱️ Time Limit in seconds (null means no time limit)
    timeLimit: {
      type: Number,
      default: null,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    questions: {
      type: [questionSchema],
      required: true,
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: "A test must have at least one question.",
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ForPublicTest", testSchema);
