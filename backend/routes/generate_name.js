// backend/routes/generate_name.js
const express = require("express");
const router = express.Router();
const { generateCourseName } = require("../services/NameGenerator");
const CourseOutline = require("../models/CourseOutline");
const { outlineQueue } = require("../queues/courseQueue");

/**
 * POST /api/generate-name
 * → Return AI name immediately; queue outline in background.
 */
router.post("/", async (req, res) => {
  try {
    const { userInput } = req.body;
    if (!userInput || typeof userInput !== "string" || !userInput.trim()) {
      return res.status(400).json({ error: "Invalid or empty input provided." });
    }

    const cleanInput = userInput.trim();
    const nameData = await generateCourseName(cleanInput);
    const courseTitle = nameData?.suggestion?.trim();
    if (!courseTitle) return res.status(500).json({ error: "Failed to generate a valid course title." });

    // ✅ respond immediately with the name
    res.json({
      suggestion: courseTitle,
      message: "Name generated. Outline will be queued in background.",
    });

    // 🧠 background: ensure doc + queue outline
    process.nextTick(async () => {
      try {
        let course = await CourseOutline.findOne({ courseTitle });
        if (!course) {
          course = await CourseOutline.create({
            courseTitle,
            modules: [],
            status: "queued",
            isPriority: false,
          });
          console.log(`💾 [DB] Created course "${courseTitle}"`);
        } 
        else if (["completed", "generating"].includes(course.status)) {
          console.log(`⏭️ [Skip] Outline already ${course.status} for "${courseTitle}"`);
          return;
        } 
        else {
          await CourseOutline.findByIdAndUpdate(course._id, { $set: { status: "queued", isPriority: false } });
        }

        const jobId = `outline_${course._id}`;
        // A kept failed job with the same id would make add() a silent no-op → remove it first
        const oldJob = await outlineQueue.getJob(jobId);
        if (oldJob && (await oldJob.getState()) === "failed") await oldJob.remove();
        await outlineQueue.add(
          "generate-outline",
          { courseId: course._id, courseTitle },
          { jobId, removeOnComplete: true }
        );
        console.log(`🚀 [Queue] Outline queued for "${courseTitle}"`);
      } 
      catch (e) {
        console.error("❌ [Background outline queue] Error:", e.message);
      }
    });
  } 
  catch (err) {
    console.error("❌ [Generate Name] Error:", err.message);
    res.status(500).json({ error: "Failed to generate course name." });
  }
});

module.exports = router;
 