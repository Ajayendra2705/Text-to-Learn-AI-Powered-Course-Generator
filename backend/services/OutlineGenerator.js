// services/OutlineGenerator.js
const axios = require("axios");

const COHERE_API_KEY = process.env.COHERE_API_KEY;
if (!COHERE_API_KEY) {
  console.error("❌ Missing COHERE_API_KEY in environment variables.");
  process.exit(1);
}

/**
 * Generates a detailed course outline using Cohere.
 * @param {string} courseTitle - The title of the course
 * @returns {Promise<{ modules: { title: string, submodules: string[] }[] }>}
 */
async function generateCourseOutline(courseTitle) {
  console.log(`🧠 [AI] Generating course outline for: "${courseTitle}" ...`);

  const prompt = `
You are an academic course expert.

Given the course title "${courseTitle}", generate a detailed course outline as JSON.

Rules:
- Output ONLY valid JSON.
- Do NOT include explanations.
- Format strictly as:
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
  ]
}
- Provide exactly 6 modules, each with exactly 5 submodules.
- No extra commentary or formatting outside the JSON.
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
        timeout: 60000, // 60 seconds
      }
    );

    // ✅ Extract the text content safely from Cohere
    const rawText =
      response.data?.text?.trim() ||
      response.data?.message?.content?.[0]?.text?.trim();

    if (!rawText) throw new Error("No text returned from Cohere API");

    const firstBrace = rawText.indexOf("{");
    const lastBrace = rawText.lastIndexOf("}");
    if (firstBrace === -1 || lastBrace === -1) {
      throw new Error("Invalid JSON structure in Cohere response");
    }

    const jsonString = rawText.substring(firstBrace, lastBrace + 1);
    const parsed = JSON.parse(jsonString);

    // ✅ Validate format
    if (!parsed.modules || !Array.isArray(parsed.modules)) {
      throw new Error("Missing or invalid 'modules' array");
    }

    // ✅ Normalize modules and submodules
    parsed.modules = parsed.modules.slice(0, 6).map((mod, i) => ({
      title: mod.title || `Module ${i + 1}`,
      submodules:
        Array.isArray(mod.submodules) && mod.submodules.length > 0
          ? mod.submodules.slice(0, 5)
          : ["Topic 1", "Topic 2", "Topic 3", "Topic 4", "Topic 5"],
    }));

    while (parsed.modules.length < 6) {
      parsed.modules.push({
        title: `Module ${parsed.modules.length + 1}`,
        submodules: ["Topic 1", "Topic 2", "Topic 3", "Topic 4", "Topic 5"],
      });
    }

    console.log(`✅ [AI] Successfully generated outline for "${courseTitle}"`);
    return parsed;
  } catch (err) {
    console.error("❌ Outline generation error:", err.response?.data || err.message);
    throw new Error("Failed to generate course outline");
  }
}

module.exports = { generateCourseOutline };
