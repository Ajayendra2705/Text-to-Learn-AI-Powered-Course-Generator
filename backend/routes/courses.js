const express = require("express");
const router = express.Router();
const Course = require("../models/Course");

// Save a new course
router.post("/", async (req, res) => {
  const { userId, title } = req.body;
  if (!userId || !title) {
    return res.status(400).json({ error: "Missing userId or title" });
  }

  try {
    const newCourse = new Course({ userId, title });
    await newCourse.save();
    res.status(201).json(newCourse);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to save course" });
  }
});

// Delete a course by ID
router.delete("/:id", async (req, res) => {
  try {
    const deletedCourse = await Course.findByIdAndDelete(req.params.id);
    if (!deletedCourse) {
      return res.status(404).json({ error: "Course not found" });
    }
    res.json({ message: "Course deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete course" });
  }
});

// Get all courses for a user
router.get("/:userId", async (req, res) => {
  try {
    const courses = await Course.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.json(courses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to get courses" });
  }
});

module.exports = router;
