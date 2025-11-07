const axios = require("axios");
const COHERE_API_KEY = process.env.COHERE_API_KEY;

if (!COHERE_API_KEY) {
  console.error("❌ Missing COHERE_API_KEY in environment variables.");
  process.exit(1);
}

async function generateCourseName(topic) {
  console.log(`🧠 [AI] Generating course name for topic: "${topic}"`);

  const prompt = `
You are an academic course naming expert.
Given the topic "${topic}", create ONE professional and engaging university-level course title.

Rules:
- Output ONLY valid JSON in this format: { "suggestion": "Your Title Here" }
- Keep the title between 5 and 12 words.
- Avoid generic terms like "Introduction to" unless necessary.
- Keep it concise and academic, no extra commentary.
`.trim();

  try {
    const response = await axios.post(
      "https://api.cohere.ai/v1/chat",
      {
        model: "command-a-03-2025",
        message: prompt,
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${COHERE_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 15000,
      }
    );

    const rawText =
      response.data?.text?.trim() ||
      response.data?.message?.content?.[0]?.text?.trim();

    if (!rawText) throw new Error("Empty response from Cohere API");

    const firstBrace = rawText.indexOf("{");
    const lastBrace = rawText.lastIndexOf("}");
    if (firstBrace === -1 || lastBrace === -1) {
      throw new Error("Invalid JSON format from AI output");
    }

    const parsed = JSON.parse(rawText.substring(firstBrace, lastBrace + 1));

    if (!parsed.suggestion) {
      throw new Error("Missing 'suggestion' field in AI output");
    }

    console.log(`✅ [AI] Suggested course name: "${parsed.suggestion}"`);
    return parsed;
  } catch (err) {
    console.error("❌ Cohere API error:", err.response?.data || err.message);
    throw new Error("Failed to generate course name");
  }
}

module.exports = { generateCourseName };
