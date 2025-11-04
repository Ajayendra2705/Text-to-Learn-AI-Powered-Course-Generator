const express = require("express");
const router = express.Router();
const axios = require("axios");

// Load API key from environment
const COHERE_API_KEY = process.env.COHERE_API_KEY;
if (!COHERE_API_KEY) {
  console.error("❌ COHERE_API_KEY not set in environment variables.");
  process.exit(1); // Stop server early if no key
}

// ✅ Function using the new Cohere Chat API + live model
async function generateCourseName(topic) {
  const prompt = `
You are an academic course naming expert.
Given the topic "${topic}", create ONE professional and engaging university-level course title.

Rules:
- Output ONLY valid JSON in this format: { "suggestion": "Your Title Here" }
- Keep the title between 5 and 12 words.
- Do not include "Introduction to" unless necessary.
- Make it sound academic yet appealing.
- Only output JSON, no extra text.
`.trim();

  try {
    const response = await axios.post(
      "https://api.cohere.ai/v1/chat",
      {
        // ✅ Use the current live model (not deprecated)
        model: "command-a-03-2025",
        // ✅ Correct field per November 2025 docs
        message: prompt,
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${COHERE_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 10000, // 10 seconds timeout
      }
    );

    // ✅ Response extraction (covers both formats)
    const rawText = response.data?.text?.trim() ||
                    response.data?.message?.content?.[0]?.text?.trim();

    if (!rawText) {
      throw new Error("No text returned from Cohere API");
    }

    // ✅ Extract JSON substring safely
    const firstBrace = rawText.indexOf("{");
    const lastBrace = rawText.lastIndexOf("}");
    if (firstBrace === -1 || lastBrace === -1) {
      throw new Error("Invalid JSON format received from Cohere API");
    }

    const jsonString = rawText.substring(firstBrace, lastBrace + 1);
    const parsed = JSON.parse(jsonString);

    if (!parsed.suggestion) {
      throw new Error("Parsed JSON missing 'suggestion' field");
    }

    return parsed;
  } catch (err) {
    console.error("❌ Error calling Cohere API:", err.response?.data || err.message);
    throw err;
  }
}

// POST /api/generate_name
router.post("/", async (req, res) => {
  const { userInput } = req.body;

  if (!userInput || typeof userInput !== "string" || !userInput.trim()) {
    return res.status(400).json({ error: "Invalid or empty input provided." });
  }

  try {
    const nameData = await generateCourseName(userInput.trim());
    res.json(nameData); // { suggestion: "AI-Generated Title" }
  } catch (err) {
    console.error("❌ Error generating course name:", err.message);
    res.status(500).json({ error: "Failed to generate course name." });
  }
});

module.exports = router;
