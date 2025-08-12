const mongoose = require("mongoose");

const mcqSchema = new mongoose.Schema({
  question: String,
  options: [String],
  answer: String,
});

const topicDetailSchema = new mongoose.Schema({
  topic: { type: String, required: true, unique: true },
  text: [String],               // array of paragraphs
  videos: [String],             // array of YouTube URLs
  mcqs: [mcqSchema],            // array of MCQs
  extraQuestions: [String],     // array of extra questions
  createdAt: { type: Date, default: Date.now },
});

const TopicDetail = mongoose.model("TopicDetail", topicDetailSchema);

module.exports = TopicDetail;
