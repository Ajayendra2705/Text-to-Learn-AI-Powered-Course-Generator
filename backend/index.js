const express = require("express");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const COHERE_API_KEY = process.env.COHERE_API_KEY;
if (!COHERE_API_KEY) {
  console.error("❌ COHERE_API_KEY is missing. Set it in .env");
  process.exit(1);
}

async function generateCourseOutline(topic) {
  const prompt = `
You are a university-level course planner.
Create ONLY the structure for a course titled "${topic}".
Return a JSON array of 5–7 modules, each with:
- module: short academic title
- submodules: 3–5 short academic submodule titles

Rules:
- Do not include descriptions, videos, or MCQs.
- Only output JSON, no extra text.
`;

  const response = await axios.post(
    "https://api.cohere.ai/v1/generate",
    {
      model: "command",
      prompt,
      max_tokens: 600,
      temperature: 0.7,
      p: 0.75
    },
    {
      headers: {
        Authorization: `Bearer ${COHERE_API_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );

  let rawText = response.data.generations?.[0]?.text.trim();
  const firstBracket = rawText.indexOf("[");
  const lastBracket = rawText.lastIndexOf("]");
  if (firstBracket !== -1 && lastBracket !== -1) {
    rawText = rawText.substring(firstBracket, lastBracket + 1);
  }
  return JSON.parse(rawText);
}

/**
 * Generate content for a single topic
 */
async function generateTopicContent(topic) {
  const prompt = `
You are an AI that outputs ONLY valid JSON.

Generate complete academic content for the topic "${topic}" in EXACTLY this JSON format:
{
  "title": "string",
  "description": "string",
  "content": "string",
  "videos": [
    { "title": "string", "url": "https://www.youtube.com/embed/VIDEO_ID" },
    { "title": "string", "url": "https://www.youtube.com/embed/VIDEO_ID" }
  ],
  "mcqs": [
    {
      "question": "string",
      "options": ["string", "string", "string", "string"],
      "answer": "string"
    },
    {
      "question": "string",
      "options": ["string", "string", "string", "string"],
      "answer": "string"
    },
    {
      "question": "string",
      "options": ["string", "string", "string", "string"],
      "answer": "string"
    },
    {
      "question": "string",
      "options": ["string", "string", "string", "string"],
      "answer": "string"
    },
    {
      "question": "string",
      "options": ["string", "string", "string", "string"],
      "answer": "string"
    }
  ]
}

Rules:
- Use ONLY double quotes for all keys and strings.
- Do NOT add trailing commas.
- Do NOT include any text outside the JSON.
- No markdown formatting.
- Ensure valid JSON syntax — parsable by JSON.parse().
- "content" should be 3–5 paragraphs of detailed explanation.
- MCQs must be academically relevant with exactly one correct answer.
- YouTube URLs must use the /embed/ format.
`;

  const response = await axios.post(
    "https://api.cohere.ai/v1/generate",
    {
      model: "command",
      prompt,
      max_tokens: 2500,
      temperature: 0.7,
    },
    {
      headers: {
        Authorization: `Bearer ${COHERE_API_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );

  let rawText = response.data.generations?.[0]?.text.trim();

  // Extract JSON substring
  const firstBrace = rawText.indexOf("{");
  const lastBrace = rawText.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1) {
    rawText = rawText.substring(firstBrace, lastBrace + 1);
  }

  // Try to fix common JSON issues automatically
  rawText = rawText
    .replace(/,\s*}/g, "}") // remove trailing commas before }
    .replace(/,\s*]/g, "]"); // remove trailing commas before ]

  return JSON.parse(rawText);
}

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
`;

  const response = await axios.post(
    "https://api.cohere.ai/v1/generate",
    {
      model: "command",
      prompt,
      max_tokens: 50,
      temperature: 0.7
    },
    {
      headers: {
        Authorization: `Bearer ${COHERE_API_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );

  let rawText = response.data.generations?.[0]?.text.trim();

  // Extract JSON from the AI output
  const firstBrace = rawText.indexOf("{");
  const lastBrace = rawText.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1) {
    rawText = rawText.substring(firstBrace, lastBrace + 1);
  }

  return JSON.parse(rawText);
}


// ===== Routes =====

app.post("/generate_name", async (req, res) => {
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

app.post("/generate_course", async (req, res) => {
  const { userInput } = req.body;
  if (!userInput || typeof userInput !== "string" || !userInput.trim()) {
    return res.status(400).json({ error: "Invalid or empty input provided." });
  }

  try {
    const outline = await generateCourseOutline(userInput.trim());
    res.json({ modules: outline });
  } catch (err) {
    console.error("❌ Error generating course outline:", err.message);
    res.status(500).json({ error: "Failed to generate course outline." });
  }
});

app.post("/generate_topic", async (req, res) => {
  const { topic } = req.body;

  if (!topic) {
    return res.status(400).json({ error: "Topic is required" });
  }

  try {
    const details = await generateTopicContent(topic.trim());
    res.json(details);
  } 
  catch (err) {
    console.error("❌ Error generating topic content:", err.message);
    res.status(500).json({ error: "Failed to generate topic content." });
  }
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`✅ Server running on http://localhost:${PORT}`)
);
