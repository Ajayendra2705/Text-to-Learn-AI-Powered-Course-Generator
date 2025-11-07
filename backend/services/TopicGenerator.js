// services/TopicGenerator.js
const axios = require("axios");

const COHERE_API_KEY = process.env.COHERE_API_KEY;
if (!COHERE_API_KEY) {
  console.error("❌ Missing COHERE_API_KEY in environment variables.");
  process.exit(1);
}

/**
 * Sanitizes malformed JSON text from Cohere.
 */
function sanitizeJSON(text) {
  return (
    text
      .replace(/\\\(/g, "(")
      .replace(/\\\)/g, ")")
      .replace(/\\(?!["\\/bfnrtu])/g, "\\\\")
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'")
      .replace(/[\x00-\x1F\x7F]/g, "")
  );
}

/**
 * Generate detailed academic topic content using Cohere.
 * @param {string} courseTitle
 * @param {string} moduleName
 * @param {string} topic
 * @returns {Promise<Object>}
 */
async function generateTopicDetails(courseTitle, moduleName, topic) {
  console.log(`🧠 [AI] Generating details for topic "${topic}" (${moduleName})`);

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
        timeout: 180000, // 3 min for long responses
      }
    );

    const rawText =
      response.data?.text?.trim() ||
      response.data?.message?.content?.[0]?.text?.trim();

    if (!rawText) throw new Error("Empty response from Cohere API");

    const firstBrace = rawText.indexOf("{");
    const lastBrace = rawText.lastIndexOf("}");
    if (firstBrace === -1 || lastBrace === -1)
      throw new Error("Invalid JSON returned by Cohere");

    const cleanedJSON = sanitizeJSON(rawText.substring(firstBrace, lastBrace + 1));

    let parsed;
    try {
      parsed = JSON.parse(cleanedJSON);
    } catch (err) {
      console.error("❌ Failed to parse Cohere output:", cleanedJSON);
      throw err;
    }

    // ✅ Basic structure validation
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
      throw new Error("Incomplete or invalid topic detail structure");
    }

    console.log(`✅ [AI] Topic details generated for "${topic}"`);
    return parsed;
  } catch (err) {
    console.error("❌ Cohere error (topic generation):", err.response?.data || err.message);
    throw err;
  }
}

module.exports = { generateTopicDetails };
