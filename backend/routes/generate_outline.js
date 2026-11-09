// backend/routes/generate_outline.js
const express = require("express");
const router = express.Router();
const CourseOutline = require("../models/CourseOutline");
const { priorityOutlineQueue } = require("../queues/priorityCourseQueue");

/**
 * ✅ GET /api/generate_outline/check/:courseTitle
 * Used by frontend LeftPanel to check outline generation status.
 */
router.get("/check/:courseTitle", async (req, res) => {
  try {
    const cleanTitle = decodeURIComponent(req.params.courseTitle.trim());
    const outline = await CourseOutline.findOne({ courseTitle: cleanTitle }).lean();

    if (!outline) {
      console.log(`🕓 [Check] No outline found for "${cleanTitle}"`);
      return res.status(404).json({
        status: "pending",
        message: "Outline not yet generated or queued.",
      });
    }

    // ✅ If generation completed
    if (
      outline.status === "completed" &&
      Array.isArray(outline.modules) &&
      outline.modules.length > 0
    ) {
      return res.json({
        status: "completed",
        courseTitle: outline.courseTitle,
        modules: outline.modules,
      });
    }

    // ⚙️ Still generating or queued
    return res.json({
      status: outline.status || "queued",
      courseTitle: outline.courseTitle,
      modules: outline.modules || [],
    });
  } catch (err) {
    console.error("❌ [Check Outline] Error:", err.message);
    res.status(500).json({ error: "Failed to fetch outline status." });
  }
});

/**
 * ⚡ POST /api/generate_outline/priority
 * Used by frontend (LeftPanel) to start priority outline generation.
 */
router.post("/priority", async (req, res) => {
  try {
    const { courseTitle } = req.body;

    if (!courseTitle || typeof courseTitle !== "string" || !courseTitle.trim()) {
      return res.status(400).json({ error: "Invalid or empty course title." });
    }

    const cleanTitle = courseTitle.trim();
    console.log(`🚀 [Priority] Queueing outline for: "${cleanTitle}"`);

    // Step 1️⃣ — Create or update existing DB entry
    let outline = await CourseOutline.findOne({ courseTitle: cleanTitle });

    if (!outline) {
      outline = await CourseOutline.create({
        courseTitle: cleanTitle,
        status: "queued",
        isPriority: true,
        modules: [],
      });
      console.log(`🗂️ Created new CourseOutline record for "${cleanTitle}"`);
    } else {
      outline.status = "queued";
      outline.isPriority = true;
      outline.modules = [];
      await outline.save();
      console.log(`♻️ Updated existing CourseOutline for "${cleanTitle}"`);
    }

    // Step 2️⃣ — Add job to the priority queue
    await priorityOutlineQueue.add("priority-outline-job", {
      courseId: outline._id,
      courseTitle: cleanTitle,
    });

    console.log(`⚡ [Queue] Added "${cleanTitle}" to priority-outline-generation queue`);
    res.json({
      message: "Priority outline queued successfully",
      courseTitle: cleanTitle,
      courseId: outline._id,
    });
  } catch (err) {
    console.error("❌ [Priority Outline] Error:", err.message);
    res.status(500).json({ error: "Failed to queue priority outline generation." });
  }
});

module.exports = router;
