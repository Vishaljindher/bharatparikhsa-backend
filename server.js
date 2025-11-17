// ✅ server.js
require("dotenv").config();

const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/df.js");
const userRoutes = require("./routes/userRoutes.js");
const testRoutes = require("./routes/testRoutes.js");
const questionRoutes = require("./routes/questionRoutes.js");
const createTestRoutes = require("./routes/createtestroute.js");
//const extractionRoutes = require("./routes/extractionRoutes");
const paymentRoute = require("./routes/paymentRoute.js");
const flashcardRoutes = require("./routes/flashcardRoutes.js");
const testTypeRoutes = require("./routes/testTypeRoutes.js");
const userActivityRoutes = require("./routes/userActivityRoutes.js");

const cors = require("cors");
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

// Load environment variables
dotenv.config();

// Connect to Database
connectDB();

// Initialize Express app
const app = express();

// Middleware
// CORS FIX 🔥🔥🔥
app.use(cors({
  origin: [

    "https://bharatparikhsa.online",
    "https://bharatparikhsa.netlify.app"
  ],
  methods: "GET,POST,PUT,DELETE,PATCH,OPTIONS",
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

// Allow preflight requests
app.options("*", cors());
// Enable CORS
app.use(express.json()); // Parse JSON requests

// --- Default Route ---
app.get("/", (req, res) => {
  res.send("✅ API is running... fourteen days later");
});

// --- API Routes ---
app.use("/api/users", userRoutes); // 👤 User routes
app.use("/api/tests", testRoutes); // 🧾 Regular test routes
app.use("/api/publictests", createTestRoutes); // 🌐 Public test creation + fetching
app.use("/api/questions", questionRoutes); // ❓ Question routes

app.use("/api/payment", paymentRoute);
app.use("/api/flashcards", flashcardRoutes);
app.use("/api/test-types", testTypeRoutes);
//app.use("/api", extractionRoutes);
app.use("/api/activity", userActivityRoutes);
// --- AI Question Extraction Route ---
/*app.post("/api/extract-questions", async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: "❌ Text is required" });
  }

  if (!process.env.OPENROUTER_API_KEY) {
    return res.status(500).json({ error: "❌ Missing OpenRouter API key in .env" });
  }

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-r1:free",
        messages: [
          {
            role: "system",
            content:
              "You are a question extraction bot. Extract ONLY questions from the given text. Respond in plain text with one question per line.",
          },
          { role: "user", content: text },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("❌ API Error:", errText);
      return res
        .status(response.status)
        .json({ error: `OpenRouter API error: ${errText}` });
    }

    const data = await response.json();
    const message = data?.choices?.[0]?.message?.content?.trim();

    if (!message) {
      console.error("⚠️ Empty AI response:", data);
      return res.status(500).json({ error: "❌ AI returned empty response" });
    }

    res.json({
      questions: message
        .split("\n")
        .filter((q) => q.trim() !== ""),
    });
  } catch (err) {
    console.error("💥 Backend fetch error:", err);
    res.status(500).json({ error: "❌ Failed to fetch from DeepSeek" });
  }
});*/

// --- Start Server ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
