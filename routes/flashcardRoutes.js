// routes/flashcardRoutes.js

const express = require("express");
const {
  getDecks,
  getFlashcardsByDeck,
  addFlashcard,
  updateReview,
} = require("../controller/FlashcardController.js");

const router = express.Router();

router.get("/decks", getDecks);
router.get("/deck/:deckId", getFlashcardsByDeck);
router.post("/add", addFlashcard);
router.post("/review", updateReview);

module.exports = router;
