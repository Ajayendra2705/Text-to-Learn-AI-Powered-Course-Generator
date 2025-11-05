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
      // Remove LaTeX-style syntax
      .replace(/\\\(/g, "(")
      .replace(/\\\)/g, ")")
      // Fix unescaped backslashes
      .replace(/\\(?!["\\/bfnrtu])/g, "\\\\")
      // Normalize smart quotes
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'")
      // Remove control characters
      .replace(/[\x00-\x1F\x7F]/g, "")
  );
}

/**
 * ✅ Generate structured topic details using Cohere Chat API
 * Adds awareness of course & module context.
 */
async function generateTopicDetails(courseTitle, moduleName, topic) {
  const prompt = `
You are an academic course content generator.

Course: "${courseTitle}"
Module: "${moduleName}"
Topic: "${topic}"

Generate comprehensive and structured learning material for this topic as valid JSON only.

Format the output as:

{
  "text": [
    "3–6 complete academic-style paragraphs explaining the topic, including examples, relevance to the module, and key concepts."
  ],
  "videos": [
    "2–4 real or plausible YouTube video URLs related to this topic."
  ],
  "mcqs": [
    {
      "question": "Conceptual multiple-choice question about the topic?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answer": "Correct option text"
    }
  ],
  "extraQuestions": [
    "2–4 open-ended discussion or reflective questions for students."
  ]
}

Rules:
- Output must be valid JSON only (no markdown, no text outside JSON).
- Escape quotes correctly.
- Avoid LaTeX syntax like \\( or \\).
- Do not truncate any JSON fields.
- Ensure all keys (text, videos, mcqs, extraQuestions) exist.
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

    // ✅ Extract JSON only
    const firstBrace = rawText.indexOf("{");
    const lastBrace = rawText.lastIndexOf("}");
    if (firstBrace === -1 || lastBrace === -1)
      throw new Error("Invalid JSON format received from Cohere API");

    const jsonString = rawText.substring(firstBrace, lastBrace + 1);
    const cleanedJSON = sanitizeJSON(jsonString);

    let parsed;
    try {
      parsed = JSON.parse(cleanedJSON);
    } catch (parseErr) {
      console.error("❌ Still failed to parse JSON:", cleanedJSON);
      throw parseErr;
    }

    // ✅ Validate structure
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

/**
 * ✅ POST /api/topic_details
 * Generates or retrieves cached topic details
 */
router.post("/", async (req, res) => {
  const { topic, moduleName, courseTitle } = req.body;

  if (!topic || typeof topic !== "string" || !topic.trim()) {
    return res.status(400).json({ error: "Invalid or empty topic provided." });
  }

  try {
    // ✅ Check DB cache first
    const cached = await TopicDetail.findOne({
      topic: topic.trim(),
      moduleName: moduleName?.trim() || null,
      courseTitle: courseTitle?.trim() || null,
    });

    if (cached) {
      console.log("✅ Found topic details in DB cache");
      return res.json({
        text: cached.text,
        videos: cached.videos,
        mcqs: cached.mcqs,
        extraQuestions: cached.extraQuestions,
        cached: true,
      });
    }

    // ✅ Generate via Cohere
    const details = await generateTopicDetails(
      courseTitle?.trim() || "General Course",
      moduleName?.trim() || "General Module",
      topic.trim()
    );

    // ✅ Save to DB with full context
    const newTopicDetail = new TopicDetail({
      topic: topic.trim(),
      moduleName: moduleName?.trim() || null,
      courseTitle: courseTitle?.trim() || null,
      text: details.text,
      videos: details.videos,
      mcqs: details.mcqs,
      extraQuestions: details.extraQuestions,
    });

    await newTopicDetail.save();

    res.json({ ...details, cached: false });
  } catch (err) {
    console.error("❌ Error in /api/topic_details:", err.message);
    res.status(500).json({ error: "Failed to generate topic details." });
  }
});

module.exports = router;
