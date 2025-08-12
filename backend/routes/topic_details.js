const express = require("express");
const router = express.Router();
const axios = require("axios");
const TopicDetail = require("../models/TopicDetail");

const COHERE_API_KEY = process.env.COHERE_API_KEY;
if (!COHERE_API_KEY) {
  console.error("❌ COHERE_API_KEY not set in environment variables.");
  process.exit(1);
}

async function generateTopicDetails(topic) {
  const prompt = `
You are an academic content expert.

Given the topic "${topic}", generate detailed content including:

1. Text paragraphs explaining the topic clearly.
2. A list of relevant YouTube video URLs.
3. A few MCQs with question, options, and correct answer.
4. Some extra open-ended questions for deeper learning.

Output ONLY valid JSON in the following format:

{
  "text": [
    "Paragraph 1 about the topic.",
    "Paragraph 2 about the topic.",
    "...more paragraphs..."
  ],
  "videos": [
    "https://youtube.com/example1",
    "https://youtube.com/example2"
  ],
  "mcqs": [
    {
      "question": "Sample question?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answer": "Option B"
    }
  ],
  "extraQuestions": [
    "Explain the concept of ...",
    "Describe how ..."
  ]
}

No extra text, no explanations, only JSON.
`;

  try {
    const response = await axios.post(
      "https://api.cohere.ai/v1/generate",
      {
        model: "command",
        prompt,
        max_tokens: 10000,
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${COHERE_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 300000,
      }
    );

    const rawText = response.data?.generations?.[0]?.text?.trim();
    if (!rawText) {
      throw new Error("No text returned from Cohere API");
    }

    // Extract JSON safely
    const firstBrace = rawText.indexOf("{");
    const lastBrace = rawText.lastIndexOf("}");
    if (firstBrace === -1 || lastBrace === -1) {
      throw new Error("Invalid JSON format received from Cohere API");
    }

    const jsonString = rawText.substring(firstBrace, lastBrace + 1);

    let parsed;
    try {
      parsed = JSON.parse(jsonString);
    } catch (parseErr) {
      console.error("Failed to parse JSON from AI:", jsonString);
      throw parseErr;
    }

    if (
      !parsed.text ||
      !Array.isArray(parsed.text) ||
      !parsed.videos ||
      !Array.isArray(parsed.videos) ||
      !parsed.mcqs ||
      !Array.isArray(parsed.mcqs) ||
      !parsed.extraQuestions ||
      !Array.isArray(parsed.extraQuestions)
    ) {
      throw new Error("Parsed JSON missing expected fields or wrong format");
    }

    return parsed;
  } catch (err) {
    console.error("❌ Error calling Cohere API for topic details:", err.response?.data || err.message || err);
    throw err;
  }
}

router.post("/", async (req, res) => {
  const { topic } = req.body;

  if (!topic || typeof topic !== "string" || !topic.trim()) {
    return res.status(400).json({ error: "Invalid or empty topic provided." });
  }

  try {
    // Check DB cache first
    const cached = await TopicDetail.findOne({ topic: topic.trim() });
    if (cached) {
      return res.json({
        text: cached.text,
        videos: cached.videos,
        mcqs: cached.mcqs,
        extraQuestions: cached.extraQuestions,
        cached: true,
      });
    }

    // Not cached? Call API
    const details = await generateTopicDetails(topic.trim());

    // Save to DB cache
    const newTopicDetail = new TopicDetail({
      topic: topic.trim(),
      text: details.text,
      videos: details.videos,
      mcqs: details.mcqs,
      extraQuestions: details.extraQuestions,
    });

    await newTopicDetail.save();

    res.json({ ...details, cached: false });
  } catch (err) {
    console.error("Error in /api/topic_details:", err);
    res.status(500).json({ error: "Failed to generate topic details." });
  }
});

module.exports = router;
