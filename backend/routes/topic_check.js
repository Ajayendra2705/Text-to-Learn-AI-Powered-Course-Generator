// backend/routes/topic_check.js
const express = require("express");
const router = express.Router();
const TopicDetail = require("../models/TopicDetail");

/**
 * GET /api/topic_details/check/:courseTitle/:moduleName/:topic
 * Checks if topic details exist in MongoDB.
 */
router.get(
  "/check/:courseTitle/:moduleName/:topic",
  async (req, res) => {
    try {
      const { courseTitle, moduleName, topic } = req.params;

      const doc = await TopicDetail.findOne({
        courseTitle: decodeURIComponent(courseTitle),
        moduleName: decodeURIComponent(moduleName),
        topic: decodeURIComponent(topic),
      });

      if (!doc) {
        return res.status(404).json({
          status: "pending",
          message: "Topic not ready yet.",
        });
      }

      return res.json({
        status: "completed",
        text: doc.text,
        videos: doc.videos,
        mcqs: doc.mcqs,
        extraQuestions: doc.extraQuestions,
      });
    } catch (err) {
      console.error("❌ [Check Topic] Error:", err.message);
      res.status(500).json({ error: "Failed to check topic." });
    }
  }
);

module.exports = router;
