const mongoose = require("mongoose");

const questionAttemptSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    questionId: { type: String, required: true }, // ya tumhare DB ke hisaab se ObjectId bhi ho sakta hai
    isCorrect: { type: Boolean, required: true },
    attemptedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("QuestionAttempt", questionAttemptSchema);
