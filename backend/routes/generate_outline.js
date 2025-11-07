// routes/generate_outline.js
const express = require("express");
const router = express.Router();
const CourseOutline = require("../models/CourseOutline");
const TopicDetail = require("../models/TopicDetail");
const { generateCourseOutline } = require("../services/OutlineGenerator");
const { generateTopicDetails } = require("../services/TopicGenerator");

router.post("/", async (req, res) => {
  try {
    const { courseTitle } = req.body;
    if (!courseTitle || typeof courseTitle !== "string" || !courseTitle.trim()) {
      return res.status(400).json({ error: "Invalid or empty courseTitle provided." });
    }

    const cleanTitle = courseTitle.trim();
    console.log(`📘 [Outline] Generating for: "${cleanTitle}"`);

    let outline = await CourseOutline.findOne({ courseTitle: cleanTitle });
    if (!outline) {
      console.log("🧠 [AI] Generating new outline...");
      const outlineData = await generateCourseOutline(cleanTitle);

      outline = await CourseOutline.create({
        courseTitle: cleanTitle,
        modules: outlineData.modules,
        status: "completed",
      });
      console.log(`💾 [DB] Saved new outline for "${cleanTitle}"`);
    } else {
      console.log("✅ [Cache] Found existing outline in DB");
    }

    // 🚀 Start topic generation (non-blocking)
    (async () => {
      const delay = (ms) => new Promise((res) => setTimeout(res, ms));
      const allTopics = [];

      for (const mod of outline.modules) {
        for (const sub of mod.submodules) {
          allTopics.push({ moduleTitle: mod.title, topic: sub });
        }
      }

      console.log(`🧩 [BG] Starting generation for ${allTopics.length} topics...`);
      const batchSize = 5;
      const pauseMs = 15000;

      for (let i = 0; i < allTopics.length; i += batchSize) {
        const batch = allTopics.slice(i, i + batchSize);

        await Promise.allSettled(
          batch.map(async ({ moduleTitle, topic }) => {
            try {
              const existing = await TopicDetail.findOne({
                courseTitle: cleanTitle,
                moduleName: moduleTitle,
                topic,
              });
              if (existing) return;

              console.log(`🧠 [AI] Generating topic: "${topic}" (${moduleTitle})`);
              const topicData = await generateTopicDetails(cleanTitle, moduleTitle, topic);

              await TopicDetail.create({
                courseTitle: cleanTitle,
                moduleName: moduleTitle,
                topic,
                text: topicData.text,
                videos: topicData.videos,
                mcqs: topicData.mcqs,
                extraQuestions: topicData.extraQuestions,
              });

              console.log(`💾 [DB] Saved topic details for "${topic}"`);
            } 
            catch (err) {
              if (err.code === 11000) {
                console.log(`⚠️ [DB] Duplicate topic skipped: "${topic}"`);
              } 
              else {
                console.error(`❌ [AI] Failed topic "${topic}":`, err.message);
              }
            }
          })
        );

        console.log(`⏳ Waiting ${pauseMs / 1000}s before next batch...`);
        await delay(pauseMs);
      }

      console.log(`✅ [BG] Finished generating all topics for: "${cleanTitle}"`);
    })();

    return res.json({
      id: outline._id,
      courseTitle: cleanTitle,
      modules: outline.modules,
      status: "completed",
      message: "Outline ready. Topic details generation started in background.",
    });
  } catch (err) {
    console.error("❌ [Outline] Generation failed:", err.message);
    return res.status(500).json({ error: "Failed to generate course outline." });
  }
});

module.exports = router;
