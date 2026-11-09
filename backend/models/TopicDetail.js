// backend/models/TopicDetail.js
const mongoose = require("mongoose");

const TopicDetailSchema = new mongoose.Schema(
  {
    courseTitle: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    moduleName: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    topic: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    // ✅ FIXED: Allow multiple paragraphs
    text: {
      type: [String],
      default: [],
    },
    videos: { type: [String], default: [] },
    mcqs: { type: Array, default: [] },
    extraQuestions: { type: [String], default: [] },
    status: {
      type: String,
      enum: ["queued", "generating", "completed", "failed"],
      default: "queued",
    },
    isPriority: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

// ✅ Ensure no duplicates
TopicDetailSchema.index(
  { courseTitle: 1, moduleName: 1, topic: 1 },
  { unique: true }
);

module.exports = mongoose.model("TopicDetail", TopicDetailSchema);
