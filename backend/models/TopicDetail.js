// models/TopicDetail.js
const mongoose = require("mongoose");

const mcqSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [{ type: String, required: true }],
  answer: { type: String, required: true },
});

const topicDetailSchema = new mongoose.Schema(
  {
    courseTitle: { type: String, required: true },
    moduleName: { type: String, required: true },
    topic: { type: String, required: true }, // ❌ removed global unique
    text: { type: [String], default: [] }, // array of paragraphs
    videos: { type: [String], default: [] }, // array of YouTube URLs
    mcqs: { type: [mcqSchema], default: [] }, // array of MCQs
    extraQuestions: { type: [String], default: [] }, // array of extra questions
  },
  { timestamps: true }
);

topicDetailSchema.index(
  { courseTitle: 1, moduleName: 1, topic: 1 },
  { unique: true }
);

const TopicDetail = mongoose.model("TopicDetail", topicDetailSchema);

module.exports = TopicDetail;
