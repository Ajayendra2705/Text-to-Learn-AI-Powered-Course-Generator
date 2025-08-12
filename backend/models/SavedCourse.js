const mongoose = require("mongoose");

const SubtopicSchema = new mongoose.Schema({
  name: { type: String, required: true },
});

const TopicSchema = new mongoose.Schema({
  name: { type: String, required: true },
  subtopics: [String],  // array of subtopic names (strings)
});

const SavedCourseSchema = new mongoose.Schema({
  courseName: { type: String, required: true, unique: true },
  topics: [TopicSchema],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("SavedCourse", SavedCourseSchema);
