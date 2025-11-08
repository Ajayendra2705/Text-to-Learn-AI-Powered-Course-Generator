const express = require("express");
const router = express.Router();
const TopicDetail = require("../models/TopicDetail");
const { topicQueue } = require("../queues/courseQueue");
const { generateTopicDetails } = require("../services/TopicGenerator");

// 🧠 Normal topic route (background)
router.post("/", async (req, res) => {
  try {
    const { topic, moduleName, courseTitle } = req.body;
    if (!topic || !courseTitle)
      return res.status(400).json({ error: "Missing topic or courseTitle" });

    const cleanTopic = topic.trim();
    const cleanModule = moduleName?.trim() || "General Module";
    const cleanCourse = courseTitle.trim();

    const cached = await TopicDetail.findOne({
      topic: cleanTopic,
      moduleName: cleanModule,
      courseTitle: cleanCourse,
    });

    if (cached) {
      console.log(`✅ [Cache] Found topic details for "${cleanTopic}"`);
      return res.json({
        ...cached.toObject(),
        cached: true,
        status: "completed",
      });
    }

    // Queue background job
    const jobId = `topic:${cleanCourse}:${cleanModule}:${cleanTopic}`.replace(/[:\s]/g, "_");
    const existingJob = await topicQueue.getJob(jobId);

    if (!existingJob) {
      await topicQueue.add(
        "generate-topic",
        {
          courseTitle: cleanCourse,
          moduleTitle: cleanModule,
          topicTitle: cleanTopic,
        },
        { priority: 5, jobId } // background
      );
      console.log(`🧩 [Queue] Queued background topic: "${cleanTopic}"`);
    } else {
      console.log(`⚠️ [Queue] Topic already queued: "${cleanTopic}"`);
    }

    return res.json({
      topic: cleanTopic,
      moduleName: cleanModule,
      status: "queued",
      message: "Topic generation queued in background.",
    });
  } catch (err) {
    console.error("❌ [API] Topic details generation failed:", err.message);
    return res.status(500).json({ error: "Failed to generate topic details." });
  }
});

// ⚡ PRIORITY route (user-clicked)
router.post("/priority", async (req, res) => {
  try {
    const { topic, moduleName, courseTitle } = req.body;
    if (!topic || !courseTitle)
      return res.status(400).json({ error: "Missing topic or courseTitle" });

    const cleanTopic = topic.trim();
    const cleanModule = moduleName?.trim() || "General Module";
    const cleanCourse = courseTitle.trim();

    // ✅ Check if already in DB
    const cached = await TopicDetail.findOne({
      topic: cleanTopic,
      moduleName: cleanModule,
      courseTitle: cleanCourse,
    });

    if (cached) {
      console.log(`✅ [Cache] Returning completed topic "${cleanTopic}"`);
      return res.json({
        ...cached.toObject(),
        cached: true,
        status: "completed",
      });
    }

    // ⚡ Create priority job
    const jobId = `topic:${cleanCourse}:${cleanModule}:${cleanTopic}`.replace(/[:\s]/g, "_");
    const existingJob = await topicQueue.getJob(jobId);

    if (!existingJob) {
      await topicQueue.add(
        "generate-topic",
        {
          courseTitle: cleanCourse,
          moduleTitle: cleanModule,
          topicTitle: cleanTopic,
        },
        { priority: 1, jobId } // high-priority
      );
      console.log(`⚡ [Queue] Priority topic queued: "${cleanTopic}"`);
    } else {
      console.log(`⚠️ [Queue] Topic already in queue: "${cleanTopic}"`);
    }

    // 🟡 Immediate response to frontend
    return res.json({
      topic: cleanTopic,
      moduleName: cleanModule,
      status: "queued",
      message: "Topic generation started (priority).",
    });
  } catch (err) {
    console.error("❌ [API] Priority topic generation failed:", err.message);
    return res.status(500).json({ error: "Failed to start priority topic generation." });
  }
});

module.exports = router;
