const express = require("express");
const router = express.Router();
const { generateCourseName } = require("../services/NameGenerator");
const { outlineQueue } = require("../queues/courseQueue");
const CourseOutline = require("../models/CourseOutline");

router.post("/", async (req, res) => {
  const { userInput } = req.body;

  // 🧩 Validate user input
  if (!userInput || typeof userInput !== "string" || !userInput.trim()) {
    return res.status(400).json({ error: "Invalid or empty input provided." });
  }

  const cleanInput = userInput.trim();
  console.log(`🎓 [Input] Topic received: "${cleanInput}"`);

  try {
    // 🧠 Generate course name suggestion via AI
    const nameResult = await generateCourseName(cleanInput);
    const finalTitle = nameResult?.suggestion?.trim() || cleanInput;
    console.log(`🧠 [AI] Suggested course name: "${finalTitle}"`);

    // 🧩 Check if the course already exists
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

    // 🆕 Create placeholder in DB
    course = await CourseOutline.create({
      courseTitle: finalTitle,
      modules: [],
      status: "queued",
    });

    // ✅ Use a unique jobId so duplicate jobs are prevented
    const jobId = `outline_${course._id.toString()}`;

    // 🚀 Add to queue (background generation)
    await outlineQueue.add(
      "generate-outline",
      {
        courseId: course._id.toString(),
        courseTitle: finalTitle,
      },
      {
        jobId, // prevents duplicates
        removeOnComplete: true,
        removeOnFail: false,
        priority: 5, // normal priority
      }
    );

    console.log(`🚀 [Queue] Outline job queued for "${finalTitle}"`);

    // ✅ Respond back to frontend
    return res.json({
      suggestion: finalTitle,
      id: course._id,
      status: "queued",
      message:
        "Course name generated successfully. Outline generation queued in background.",
    });
  } catch (err) {
    console.error("❌ [API] Error in generate_name:", err.message);
    return res.status(500).json({ error: "Failed to generate course name." });
  }
});

module.exports = router;
