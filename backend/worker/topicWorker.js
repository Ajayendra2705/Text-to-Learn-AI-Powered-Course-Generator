require("dotenv").config({ path: "../.env" });
const { Worker } = require("bullmq");
const IORedis = require("ioredis");
const mongoose = require("mongoose");
const { generateTopicDetails } = require("../services/TopicGenerator");
const TopicDetail = require("../models/TopicDetail");

const connection = new IORedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
  tls: process.env.REDIS_URL.startsWith("rediss://")
    ? { rejectUnauthorized: false }
    : undefined,
});

mongoose.connect(process.env.MONGODB_URI).then(() => {
  console.log("✅ MongoDB connected (Topic Worker)");
});

const worker = new Worker(
  "topic-generation",
  async (job) => {
    const { courseId, courseTitle, moduleTitle, topicTitle } = job.data;
    console.log(`🧠 [Worker] Generating topic "${topicTitle}"`);

    const existing = await TopicDetail.findOne({
      courseTitle,
      moduleName: moduleTitle,
      topic: topicTitle,
    });
    if (existing) return console.log(`⚠️ [Skip] Duplicate topic: "${topicTitle}"`);

    try {
      const data = await generateTopicDetails(courseTitle, moduleTitle, topicTitle);
      await TopicDetail.create({
        courseTitle,
        moduleName: moduleTitle,
        topic: topicTitle,
        text: data.text,
        videos: data.videos,
        mcqs: data.mcqs,
        extraQuestions: data.extraQuestions,
      });

      console.log(`💾 [DB] Topic saved: "${topicTitle}"`);
    } catch (err) {
      console.error(`❌ [Worker] Failed to generate topic "${topicTitle}":`, err.message);
    }
  },
  { connection, concurrency: 3 } // 3 at a time safely under Cohere limits
);

worker.on("completed", (job) =>
  console.log(`🎉 [Worker] Topic done: ${job.data.topicTitle}`)
);
worker.on("failed", (job, err) =>
  console.error(`💥 [Worker] Topic failed: ${job.data.topicTitle}`, err.message)
);
