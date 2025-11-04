const express = require("express");
const router = express.Router();
const axios = require("axios");
const TopicDetail = require("../models/TopicDetail");

const COHERE_API_KEY = process.env.COHERE_API_KEY;
if (!COHERE_API_KEY) {
  console.error("❌ COHERE_API_KEY not set in environment variables.");
  process.exit(1);
}

// 🧠 Small helper to safely clean malformed JSON
function sanitizeJSON(text) {
  return (
    text
      // Remove LaTeX math or backslashes like \( \)
      .replace(/\\\(/g, "(")
      .replace(/\\\)/g, ")")
      // Replace unescaped backslashes
      .replace(/\\(?!["\\/bfnrtu])/g, "\\\\")
      // Replace smart quotes
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'")
      // Remove control characters
      .replace(/[\x00-\x1F\x7F]/g, "")
  );
}

async function generateTopicDetails(topic) {
  const prompt = `
You are a university-level content creator specializing in structured educational materials.

Generate detailed, factual, and well-organized content for the topic: "${topic}"

Return ONLY valid JSON with this structure:
{
  "text": [
    "3–6 paragraphs explaining the topic clearly in academic tone.",
    "Include concepts, examples, and real-world relevance."
  ],
  "videos": [
    "2–4 relevant YouTube links about the topic."
  ],
  "mcqs": [
    {
      "question": "Conceptual question?",
      "options": ["A", "B", "C", "D"],
      "answer": "Correct option text"
    }
  ],
  "extraQuestions": [
    "2–4 open-ended reflective questions"
  ]
}

Rules:
- Output ONLY valid JSON — no markdown, commentary, or explanations.
- Escape all quotes correctly.
- Avoid LaTeX symbols like \\(, \\), or \\n.
`.trim();

  try {
    const response = await axios.post(
      "https://api.cohere.ai/v1/chat",
      {
        model: "command-a-03-2025",
        message: prompt,
        temperature: 0.6,
      },
      {
        headers: {
          Authorization: `Bearer ${COHERE_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 180000,
      }
    );

    const rawText =
      response.data?.text?.trim() ||
      response.data?.message?.content?.[0]?.text?.trim();

    if (!rawText) throw new Error("No text returned from Cohere API");

    const firstBrace = rawText.indexOf("{");
    const lastBrace = rawText.lastIndexOf("}");
    if (firstBrace === -1 || lastBrace === -1) {
      throw new Error("Invalid JSON format received from Cohere API");
    }

    const jsonString = rawText.substring(firstBrace, lastBrace + 1);
    const cleanedJSON = sanitizeJSON(jsonString);

    let parsed;
    try {
      parsed = JSON.parse(cleanedJSON);
    } catch (parseErr) {
      console.error("❌ Still failed to parse JSON:", cleanedJSON);
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
    console.error(
      "❌ Error calling Cohere API for topic details:",
      err.response?.data || err.message || err
    );
    throw err;
  }
}

router.post("/", async (req, res) => {
  const { topic } = req.body;

  if (!topic || typeof topic !== "string" || !topic.trim()) {
    return res.status(400).json({ error: "Invalid or empty topic provided." });
  }

  try {
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

    const details = await generateTopicDetails(topic.trim());

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
