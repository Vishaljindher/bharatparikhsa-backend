const mongoose = require("mongoose");

const flashcardSchema = new mongoose.Schema({
  deck: { type: String, required: true },

  question: { type: String, required: true, trim: true },
  answer: { type: String, required: true, trim: true },
  easeFactor: { type: Number, default: 2.5 },
  reviewCount: { type: Number, default: 0 },
  lastReviewed: { type: Date, default: null },
  difficulty: { type: String, enum: ["easy", "medium", "hard"], default: "medium" },
  tags: [{ type: String }],
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // optional future feature
}, { timestamps: true });

flashcardSchema.index({ deck: 1 }); // for faster deck-based queries

const Flashcard = mongoose.model("Flashcard", flashcardSchema);

module.exports = Flashcard;
