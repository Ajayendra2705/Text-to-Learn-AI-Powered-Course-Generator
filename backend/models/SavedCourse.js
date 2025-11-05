const mongoose = require("mongoose");

// ✅ Define subtopic schema (future-proof)
const SubtopicSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
  },
  { _id: false } // no need for separate _id for subtopics
);

// ✅ Define topic schema
const TopicSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    subtopics: [SubtopicSchema], // array of subtopic objects
  },
  { _id: false }
);

// ✅ Main Saved Course schema
const SavedCourseSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true }, // associate with user
    courseName: { type: String, required: true },
    topics: [TopicSchema],
  },
  {
    timestamps: true, // ✅ adds createdAt & updatedAt automatically
  }
);

// ✅ Optional: prevent duplicate course per user
SavedCourseSchema.index({ userId: 1, courseName: 1 }, { unique: true });

module.exports = mongoose.model("SavedCourse", SavedCourseSchema);
