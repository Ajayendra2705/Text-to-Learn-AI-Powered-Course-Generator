// routes/topic_details.js
const express = require("express");
const router = express.Router();
const TopicDetail = require("../models/TopicDetail");
const { generateTopicDetails } = require("../services/TopicGenerator");

// ✅ POST /api/topic_details
router.post("/", async (req, res) => {
  try {
    const { topic, moduleName, courseTitle } = req.body;

    // -----------------------------
    // 🧩 Input validation
    // -----------------------------
    if (!topic || typeof topic !== "string" || !topic.trim()) {
      return res.status(400).json({ error: "Invalid or empty topic provided." });
    }

    const cleanTopic = topic.trim();
    const cleanModule = moduleName?.trim() || "General Module";
    const cleanCourse = courseTitle?.trim() || "General Course";

    // -----------------------------
    // 🧠 Check cache in MongoDB
    // -----------------------------
    const cached = await TopicDetail.findOne({
      topic: cleanTopic,
      moduleName: cleanModule,
      courseTitle: cleanCourse,
    });

    if (cached) {
      console.log(`✅ [Cache] Found topic details for "${cleanTopic}"`);
      return res.json({
        text: cached.text,
        videos: cached.videos,
        mcqs: cached.mcqs,
        extraQuestions: cached.extraQuestions,
        cached: true,
      });
    }

    // -----------------------------
    // 🧠 Generate new content via AI
    // -----------------------------
    console.log(`🧠 [AI] Generating topic details for "${cleanTopic}"...`);
    const details = await generateTopicDetails(cleanCourse, cleanModule, cleanTopic);

    // -----------------------------
    // 💾 Save new details to MongoDB
    // -----------------------------
    const newDetail = new TopicDetail({
      topic: cleanTopic,
      moduleName: cleanModule,
      courseTitle: cleanCourse,
      text: details.text,
      videos: details.videos,
      mcqs: details.mcqs,
      extraQuestions: details.extraQuestions,
    });

    await newDetail.save();
    console.log(`💾 [DB] Saved new topic details for "${cleanTopic}"`);

    // -----------------------------
    // ✅ Respond to client
    // -----------------------------
    return res.json({
      text: details.text,
      videos: details.videos,
      mcqs: details.mcqs,
      extraQuestions: details.extraQuestions,
      cached: false,
    });
  } catch (err) {
    console.error("❌ [API] Topic details generation failed:", err.message);
    return res.status(500).json({ error: "Failed to generate topic details." });
  }
});

module.exports = router;
