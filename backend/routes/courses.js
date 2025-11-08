// routes/courses.js
const express = require("express");
const router = express.Router();
const Course = require("../models/Course");
const CourseOutline = require("../models/CourseOutline");
const TopicDetail = require("../models/TopicDetail");
const { outlineQueue, topicQueue } = require("../queues/courseQueue");

// ✅ Create (Add) a new course
router.post("/", async (req, res) => {
  const { userId, title } = req.body;

  if (!userId || !title) {
    return res.status(400).json({ error: "Missing userId or title" });
  }

  try {
    const newCourse = await Course.create({ userId, title });
    console.log(`📘 [DB] Added new course "${title}" for user ${userId}`);
    res.status(201).json(newCourse);
  } catch (error) {
    console.error("❌ Error saving course:", error);
    res.status(500).json({ error: "Failed to save course" });
  }
});

// ✅ Delete a course and clean its data
router.delete("/:courseId", async (req, res) => {
  try {
    const { courseId } = req.params;
    if (!courseId) return res.status(400).json({ error: "Missing course ID" });

    // 1️⃣ Find the course in the Course collection
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ error: "Course not found" });

    const courseTitle = course.title.trim();

    console.log(`🗑️ [DELETE] Removing course "${courseTitle}"...`);

    // 2️⃣ Remove from Course
    await Course.findByIdAndDelete(courseId);

    // 3️⃣ Remove from CourseOutline (if exists)
    const outline = await CourseOutline.findOneAndDelete({ courseTitle });
    if (outline) console.log(`🗑️ [DB] Removed outline for "${courseTitle}"`);

    // 4️⃣ Remove all TopicDetails for that course
    const deletedTopics = await TopicDetail.deleteMany({ courseTitle });
    console.log(`🧹 [DB] Removed ${deletedTopics.deletedCount} topic documents.`);

    // 5️⃣ Remove all queued jobs related to this course
    const [outlineJobs, topicJobs] = await Promise.all([
      outlineQueue.getJobs(["waiting", "delayed", "active"]),
      topicQueue.getJobs(["waiting", "delayed", "active"]),
    ]);

    const matchJob = (job) =>
      job?.data?.courseTitle?.trim() === courseTitle ||
      job?.data?.courseId?.toString() === courseId;

    // Remove from outline queue
    for (const job of outlineJobs.filter(matchJob)) {
      await job.remove();
      console.log(`🧹 [Queue] Removed outline job for "${courseTitle}"`);
    }

    // Remove from topic queue
    for (const job of topicJobs.filter(matchJob)) {
      await job.remove();
      console.log(`🧹 [Queue] Removed topic job for "${courseTitle}"`);
    }

    res.json({
      success: true,
      message: `✅ Course "${courseTitle}" deleted with related outlines, topics, and queue jobs.`,
    });
  } catch (err) {
    console.error("❌ [API] Failed to delete course:", err.message);
    res.status(500).json({
      error: "Failed to delete course and clean related data.",
    });
  }
});

// ✅ Get all courses for a user (newest first)
router.get("/:userId", async (req, res) => {
  try {
    const courses = await Course.find({ userId: req.params.userId })
      .sort({ createdAt: -1 });

    res.json(Array.isArray(courses) ? courses : []);
  } catch (error) {
    console.error("❌ Error fetching courses:", error);
    res.status(500).json({ error: "Failed to get courses" });
  }
});

module.exports = router;
