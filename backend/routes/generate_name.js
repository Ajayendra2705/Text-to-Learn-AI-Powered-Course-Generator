const express = require("express");
const router = express.Router();
const { generateCourseName } = require("../services/NameGenerator");
const { outlineQueue } = require("../queues/courseQueue");
const CourseOutline = require("../models/CourseOutline");

router.post("/", async (req, res) => {
  const { userInput } = req.body;
  if (!userInput || typeof userInput !== "string" || !userInput.trim()) {
    return res.status(400).json({ error: "Invalid or empty input provided." });
  }

  const cleanInput = userInput.trim();
  console.log(`🎓 [Input] Topic received: "${cleanInput}"`);

  try {
    const nameResult = await generateCourseName(cleanInput);
    const finalTitle = nameResult?.suggestion || cleanInput;
    console.log(`🧠 [AI] Suggested course name: "${finalTitle}"`);

    let course = await CourseOutline.findOne({ courseTitle: finalTitle });
    if (course) {
      console.log(`🟡 [Cache] Existing course found: "${finalTitle}"`);
      return res.json({
        suggestion: finalTitle,
        id: course._id,
        status: course.status,
        modules: course.modules || [],
      });
    }

    // Create DB placeholder
    course = await CourseOutline.create({
      courseTitle: finalTitle,
      modules: [],
      status: "queued",
    });

    // Queue job for outline generation
    await outlineQueue.add("generate-outline", {
      courseId: course._id.toString(),
      courseTitle: finalTitle,
    });

    console.log(`🚀 [Queue] Outline job queued for "${finalTitle}"`);

    return res.json({
      suggestion: finalTitle,
      id: course._id,
      status: "queued",
      message: "Course name generated. Outline queued for background generation.",
    });
  } catch (err) {
    console.error("❌ [API] Error in generate_name:", err.message);
    res.status(500).json({ error: "Failed to generate course name." });
  }
});

module.exports = router;
