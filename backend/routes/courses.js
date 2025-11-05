const express = require("express");
const router = express.Router();
const Course = require("../models/Course");

// ✅ Create (Add) a new course
router.post("/", async (req, res) => {
  const { userId, title } = req.body;

  if (!userId || !title) {
    return res.status(400).json({ error: "Missing userId or title" });
  }

  try {
    const newCourse = new Course({ userId, title });
    await newCourse.save();

    // ✅ Return the saved course object for immediate display
    //    (frontend will prepend it)
    res.status(201).json(newCourse);
  } catch (error) {
    console.error("❌ Error saving course:", error);
    res.status(500).json({ error: "Failed to save course" });
  }
});

// ✅ Delete a course by ID
router.delete("/:id", async (req, res) => {
  try {
    const deletedCourse = await Course.findByIdAndDelete(req.params.id);

    if (!deletedCourse) {
      return res.status(404).json({ error: "Course not found" });
    }

    // ✅ Return deleted course ID for instant frontend removal
    res.json({ message: "Course deleted successfully", id: req.params.id });
  } catch (error) {
    console.error("❌ Error deleting course:", error);
    res.status(500).json({ error: "Failed to delete course" });
  }
});

// ✅ Get all courses for a user (newest → oldest)
router.get("/:userId", async (req, res) => {
  try {
    const courses = await Course.find({ userId: req.params.userId })
      .sort({ createdAt: -1 }); // ✅ ensures newest first, always

    res.json(courses);
  } catch (error) {
    console.error("❌ Error fetching courses:", error);
    res.status(500).json({ error: "Failed to get courses" });
  }
});

module.exports = router;
