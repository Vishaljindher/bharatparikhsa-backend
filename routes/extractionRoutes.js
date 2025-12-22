//my-backend/routes/extractionRoutes.js
const express = require("express");
const router = express.Router();
const { extractQuestions, saveExtracted } = require("../controller/extractionController");
const { protect } = require("../middleware/authMiddleware"); // if using auth

router.post("/extract-questions", extractQuestions);
router.post("/save-extracted", protect, saveExtracted); // ensure login user if required

module.exports = router;
