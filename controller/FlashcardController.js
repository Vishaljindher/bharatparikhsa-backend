// controllers/FlashcardController.js

const Flashcard = require("../models/Flashcard.js");

// ✅ Get all decks
const getDecks = async (req, res) => {
  try {
    const decks = await Flashcard.distinct("deck");
    res.json(decks);
  } catch (err) {
    console.error("❌ Error fetching decks:", err);
    res.status(500).json({ error: "Failed to fetch decks" });
  }
};

// ✅ Get all flashcards from a specific deck
const getFlashcardsByDeck = async (req, res) => {
  try {
    const flashcards = await Flashcard.find({ deck: req.params.deckId });
    res.json(flashcards);
  } catch (err) {
    console.error("❌ Error fetching flashcards:", err);
    res.status(500).json({ error: "Failed to fetch flashcards" });
  }
};

// ✅ Add a new flashcard (Fixed version)
const addFlashcard = async (req, res) => {
  try {
    const { deck, deckId, question, answer } = req.body;
    const deckValue = deck || deckId; // Accept both

    if (!deckValue || !question || !answer) {
      return res.status(400).json({ error: "Deck, question, and answer are required" });
    }

    const newCard = new Flashcard({
      deck: deckValue,
      question,
      answer,
    });

    await newCard.save();
    res.status(201).json({
      message: "✅ Flashcard added successfully",
      flashcard: newCard,
    });
  } catch (err) {
    console.error("❌ Error adding flashcard:", err);
    res.status(500).json({ error: "Failed to add flashcard" });
  }
};

// ✅ Update review stats (for spaced repetition)
const updateReview = async (req, res) => {
  try {
    const { cardId, rating } = req.body;
    const card = await Flashcard.findById(cardId);
    if (!card) return res.status(404).json({ error: "Flashcard not found" });

    card.reviewCount = (card.reviewCount || 0) + 1;
    card.lastReviewed = new Date();
    card.easeFactor = (card.easeFactor || 2.5) + (rating - 3) * 0.1;

    await card.save();
    res.json({
      message: "✅ Flashcard review updated successfully",
      card,
    });
  } catch (err) {
    console.error("❌ Error updating review:", err);
    res.status(500).json({ error: "Failed to update review" });
  }
};

module.exports = {
  getDecks,
  getFlashcardsByDeck,
  addFlashcard,
  updateReview,
};
