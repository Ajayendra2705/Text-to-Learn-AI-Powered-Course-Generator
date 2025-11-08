require("dotenv").config({ path: "../.env" });
const { Worker } = require("bullmq");
const IORedis = require("ioredis");
const mongoose = require("mongoose");
const { generateTopicDetails } = require("../services/TopicGenerator");
const TopicDetail = require("../models/TopicDetail");

// ----------------------
// 🔗 Redis Connection
// ----------------------
const connection = new IORedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
  tls: process.env.REDIS_URL.startsWith("rediss://")
    ? { rejectUnauthorized: false }
    : undefined,
});

// ----------------------
// 🧠 MongoDB Connection
// ----------------------
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB connected (Topic Worker)"))
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  });

// ----------------------
// ⚙️ Shared topic handler
// ----------------------
async function processTopicJob(job, queueType = "NORMAL") {
  const { courseId, courseTitle, moduleTitle, topicTitle } = job.data;
  const priority = job.opts.priority || (queueType === "PRIORITY" ? 1 : 5);

  console.log(`🧠 [${queueType}] Processing topic: "${topicTitle}"`);

  try {
    // 1️⃣ Skip if topic already exists in DB
    const existing = await TopicDetail.findOne({
      courseTitle,
      moduleName: moduleTitle,
      topic: topicTitle,
    });
    if (existing) {
      console.log(`⚠️ [${queueType}] "${topicTitle}" already exists — removing job`);
      await job.remove();
      return;
    }

    // 2️⃣ Generate topic details using AI
    const data = await generateTopicDetails(courseTitle, moduleTitle, topicTitle);

    // 3️⃣ Save topic in DB
    await TopicDetail.create({
      courseTitle,
      moduleName: moduleTitle,
      topic: topicTitle,
      text: data.text,
      videos: data.videos,
      mcqs: data.mcqs,
      extraQuestions: data.extraQuestions,
    });

    console.log(`💾 [${queueType}] Saved topic: "${topicTitle}"`);

    // 4️⃣ Cleanup job after successful save
    await job.remove();
    console.log(`🧹 [${queueType}] Removed completed job for "${topicTitle}"`);
  } catch (err) {
    console.error(`❌ [${queueType}] Failed topic "${topicTitle}":`, err.message);

    // Prevent retry loops — clean up even failed jobs
    try {
      await job.remove();
      console.log(`🧹 [${queueType}] Removed failed job for "${topicTitle}"`);
    } catch (cleanupErr) {
      console.error(`⚠️ [Cleanup] Couldn’t remove "${topicTitle}":`, cleanupErr.message);
    }
  }
}

// ----------------------
// 🧠 Topic Workers (Normal + Priority)
// ----------------------

// 🕓 Normal background topic generation
new Worker(
  "topic-generation",
  async (job) => await processTopicJob(job, "NORMAL"),
  {
    connection,
    concurrency: 3, // safe parallel limit
  }
);

// ⚡ High-priority topic generation
new Worker(
  "priority-topic-generation",
  async (job) => await processTopicJob(job, "PRIORITY"),
  {
    connection,
    concurrency: 3, // same concurrency
  }
);

// ----------------------
// 🧹 Cleanup on exit
// ----------------------
process.on("SIGINT", async () => {
  console.log("\n🧹 Shutting down Topic Worker...");
  await connection.quit();
  await mongoose.disconnect();
  console.log("👋 Topic Worker stopped cleanly");
  process.exit(0);
});
