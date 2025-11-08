const express = require("express");
const router = express.Router();
const CourseOutline = require("../models/CourseOutline");
const { outlineQueue } = require("../queues/courseQueue");

// 🧠 Normal outline generation (background, priority 5)
router.post("/", async (req, res) => {
  try {
    const { courseTitle } = req.body;

    if (!courseTitle || typeof courseTitle !== "string" || !courseTitle.trim()) {
      return res.status(400).json({ error: "Invalid or empty courseTitle provided." });
    }

    const cleanTitle = courseTitle.trim();
    console.log(`📘 [Outline] Queueing background generation for: "${cleanTitle}"`);

    // 🧠 Check for cached outline
    let course = await CourseOutline.findOne({ courseTitle: cleanTitle });
    if (course && course.status === "completed" && course.modules?.length) {
      console.log("✅ [Cache] Found completed outline, returning cached data");
      return res.json({
        id: course._id,
        courseTitle: cleanTitle,
        modules: course.modules,
        status: course.status,
        message: "Using cached course outline.",
      });
    }

    // 🧩 Create placeholder if not exists
    if (!course) {
      course = await CourseOutline.create({
        courseTitle: cleanTitle,
        modules: [],
        status: "queued",
      });
    }

    // 🧩 Prevent duplicate background jobs
    const jobKey = `outline_${cleanTitle.replace(/[^a-zA-Z0-9]/g, "_")}`;
    const existingJob = await outlineQueue.getJob(jobKey);
    if (!existingJob) {
      await outlineQueue.add(
        "generate-outline",
        { courseId: course._id, courseTitle: cleanTitle },
        { priority: 5, jobId: jobKey }
      );
      console.log(`🧩 [Queue] Outline job queued for "${cleanTitle}" (priority 5)`);
    } else {
      console.log(`⚠️ [Queue] Outline already queued: "${cleanTitle}"`);
    }

    res.json({
      id: course._id,
      courseTitle: cleanTitle,
      status: "queued",
      message: "Outline generation queued in background.",
    });
  } catch (err) {
    console.error("❌ [Outline] Error queuing outline:", err.message);
    res.status(500).json({ error: "Failed to queue course outline." });
  }
});

// ⚡ PRIORITY route — user-triggered generation (priority 1)
router.post("/priority", async (req, res) => {
  try {
    const { courseTitle } = req.body;

    if (!courseTitle || typeof courseTitle !== "string" || !courseTitle.trim()) {
      return res.status(400).json({ error: "Invalid or empty courseTitle provided." });
    }

    const cleanTitle = courseTitle.trim();
    console.log(`⚡ [Priority] Immediate outline generation requested for: "${cleanTitle}"`);

    // 🧠 Find or create outline record
    let course = await CourseOutline.findOne({ courseTitle: cleanTitle });
    if (!course) {
      course = await CourseOutline.create({
        courseTitle: cleanTitle,
        modules: [],
        status: "prioritized",
      });
    } else {
      course.status = "prioritized";
      await course.save();
    }

    // 🧩 Prevent duplicate priority jobs
    const jobKey = `outline_${cleanTitle.replace(/[^a-zA-Z0-9]/g, "_")}`;
    const existingJob = await outlineQueue.getJob(jobKey);

    if (!existingJob) {
      await outlineQueue.add(
        "generate-outline",
        { courseId: course._id, courseTitle: cleanTitle },
        { priority: 1, jobId: jobKey }
      );
      console.log(`🚀 [Queue] High-priority outline queued for "${cleanTitle}"`);
    } else {
      console.log(`⚠️ [Queue] Priority outline already queued: "${cleanTitle}"`);
    }

    res.json({
      id: course._id,
      courseTitle: cleanTitle,
      status: "prioritized",
      message: "High-priority outline generation queued.",
    });
  } catch (err) {
    console.error("❌ [Priority Outline] Error:", err.message);
    res.status(500).json({ error: "Failed to queue high-priority outline." });
  }
});

module.exports = router;
