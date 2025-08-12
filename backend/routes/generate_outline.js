const express = require("express");
const router = express.Router();
const axios = require("axios");
const CourseOutline = require("../models/CourseOutline");

const COHERE_API_KEY = process.env.COHERE_API_KEY;
if (!COHERE_API_KEY) {
  console.error("❌ COHERE_API_KEY not set in environment variables.");
  process.exit(1);
}

async function generateCourseOutline(courseTitle) {
  const prompt = `
You are an academic course expert.

Given the course title "${courseTitle}", generate a detailed course outline as JSON.

Rules:
- Output ONLY valid, complete JSON.
- Do NOT cut off or truncate output.
- Format:

{
  "modules": [
    {
      "title": "Module 1 Title",
      "submodules": ["Topic 1", "Topic 2", "Topic 3", "Topic 4", "Topic 5"]
    },
    {
      "title": "Module 2 Title",
      "submodules": ["Topic A", "Topic B", "Topic C", "Topic D", "Topic E"]
    }
    // total 6 modules like this
  ]
}

- Provide exactly 6 modules.
- Each module must have exactly 5 submodules.
- No extra text, only JSON.
`;

  try {
    const response = await axios.post(
      "https://api.cohere.ai/v1/generate",
      {
        model: "command",
        prompt,
        max_tokens: 1200,
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${COHERE_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 30000,
      }
    );

    const rawText = response.data?.generations?.[0]?.text?.trim();
    if (!rawText) {
      throw new Error("No text returned from Cohere API");
    }

    console.log("Raw AI response text:", rawText);

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

    if (!parsed.modules || !Array.isArray(parsed.modules) || parsed.modules.length !== 6) {
      throw new Error("Parsed JSON missing 'modules' array of length 6");
    }

    for (const mod of parsed.modules) {
      if (
        !mod.title ||
        typeof mod.title !== "string" ||
        !Array.isArray(mod.submodules) ||
        mod.submodules.length !== 5
      ) {
        throw new Error("Each module must have a title and exactly 5 submodules");
      }
    }

    return parsed;
  } catch (err) {
    console.error("❌ Error calling Cohere API:", err.response?.data || err.message || err);
    throw err;
  }
}

router.post("/", async (req, res) => {
  const { courseTitle } = req.body;

  console.log("Received courseTitle:", courseTitle);

  if (!courseTitle || typeof courseTitle !== "string" || !courseTitle.trim()) {
    return res.status(400).json({ error: "Invalid or empty courseTitle provided." });
  }

  try {
    // Check DB first
    const existing = await CourseOutline.findOne({ courseTitle: courseTitle.trim() });
    if (existing) {
      console.log("Found outline in DB, returning cached data.");
      return res.json({ modules: existing.modules });
    }

    // Not found in DB - call AI and save
    const outlineData = await generateCourseOutline(courseTitle.trim());

    // Save to DB
    const newOutline = new CourseOutline({
      courseTitle: courseTitle.trim(),
      modules: outlineData.modules,
    });
    await newOutline.save();

    res.json(outlineData);
  } catch (err) {
    res.status(500).json({ error: "Failed to generate course outline." });
  }
});

module.exports = router;
