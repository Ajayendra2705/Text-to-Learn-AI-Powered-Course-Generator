// backend/routes/topic_details.js
const express = require("express");
const router = express.Router();
const TopicDetail = require("../models/TopicDetail");
const { priorityTopicQueue } = require("../queues/priorityCourseQueue");

/**
 * ⚡ POST /api/topic_details/priority
 * Queues a topic for high-priority generation (triggered when user clicks a topic)
 */
router.post("/priority", async (req, res) => {
  try {
    const { topic, moduleName, courseTitle } = req.body;

    // -----------------------------
    // 🧩 Input validation
    // -----------------------------
    if (!topic || !courseTitle || !moduleName) {
      return res.status(400).json({
        error: "Missing required fields: topic, moduleName, or courseTitle.",
      });
    }

    const cleanTopic = topic.trim();
    const cleanModule = moduleName.trim();
    const cleanCourse = courseTitle.trim();

    // -----------------------------
    // 🧠 Check if topic already exists
    // -----------------------------
    const existing = await TopicDetail.findOne({
      topic: cleanTopic,
      moduleName: cleanModule,
      courseTitle: cleanCourse,
    }).lean();

    if (existing) {
      console.log(`✅ [Cache] Found existing topic: "${cleanTopic}"`);
      return res.json({
        status: existing.status || "completed",
        cached: true,
        topicDetail: existing,
        message: "Topic already exists in database.",
      });
    }

    // -----------------------------
    // ⚙️ Check if already queued
    // -----------------------------
    const jobId = `priority_${cleanCourse}_${cleanModule}_${cleanTopic}`;
    const existingJob = await priorityTopicQueue.getJob(jobId);

    if (existingJob) {
      console.log(`⚠️ [Queue] Topic already queued: "${cleanTopic}"`);
      return res.json({
        status: "queued",
        cached: false,
        message: "Topic already in queue for generation.",
      });
    }

    // -----------------------------
    // 🚀 Queue new priority job
    // -----------------------------
    await priorityTopicQueue.add(
      "generate-priority-topic",
      {
        courseTitle: cleanCourse,
        moduleTitle: cleanModule,
        topicTitle: cleanTopic,
      },
      {
        jobId,
        removeOnComplete: true,
        removeOnFail: false,
        priority: 1,
      }
    );

    console.log(`🚀 [Queue] Queued topic for generation: "${cleanTopic}"`);

    return res.json({
      status: "queued",
      cached: false,
      message: "Priority topic generation queued successfully.",
    });
  } catch (err) {
    console.error("❌ [Priority Topic API] Error:", err.message);
    return res.status(500).json({ error: "Failed to queue topic generation." });
  }
});

/**
 * 🔍 GET /api/topic_details/check/:courseTitle/:moduleName/:topic
 * Used by frontend to poll and check if topic details exist in DB
 */
router.get("/check/:courseTitle/:moduleName/:topic", async (req, res) => {
  try {
    const { courseTitle, moduleName, topic } = req.params;

    const cleanCourse = decodeURIComponent(courseTitle).trim();
    const cleanModule = decodeURIComponent(moduleName).trim();
    const cleanTopic = decodeURIComponent(topic).trim();

    const data = await TopicDetail.findOne({
      courseTitle: cleanCourse,
      moduleName: cleanModule,
      topic: cleanTopic,
    }).lean();

    if (!data) {
      return res.status(404).json({
        status: "pending",
        message: "Topic not yet generated.",
      });
    }

    return res.json({
      ...data,
      status: data.status || "completed",
    });
  } catch (err) {
    console.error("❌ [Check Topic API] Error:", err.message);
    return res.status(500).json({ error: "Failed to fetch topic details." });
  }
});

module.exports = router;
