const mongoose = require("mongoose");

const testResultSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    testName: { type: String, required: true },
    score: { type: Number, required: true },
    total: { type: Number, required: true },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("TestResult", testResultSchema);
