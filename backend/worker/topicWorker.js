// backend/workers/topicWorker.js
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const { Worker } = require("bullmq");
const mongoose = require("mongoose");
const { connection } = require("../queues/courseQueue");
const { generateTopicDetails } = require("../services/TopicGenerator");
const TopicDetail = require("../models/TopicDetail");

console.log("⚡ Starting Normal Topic Worker...");

// 🧩 MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB connected (Topic Worker)"))
  .catch((e) => {
    console.error("❌ MongoDB connection failed:", e.message);
    process.exit(1);
  });

// 🕓 Utility delay function
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function processTopic(job) {
  const { courseTitle, moduleName, topic } = job.data;
  console.log(`🧠 [Topic Worker] Generating topic "${topic}" (${moduleName}) , (${courseTitle})`);

  try {
    const existing = await TopicDetail.findOne({ courseTitle, moduleName, topic, status: "completed" }).lean();
    if (existing) {
      console.log(`⏭️ [Skip] Already exists: "${topic}"`);
      return { cached: true };
    }

    // ⏳ Add intentional 10-second gap before calling AI
    console.log("🕒 Waiting 10 seconds before AI request...");
    await delay(10000);

    const data = await generateTopicDetails(courseTitle, moduleName, topic);
    if (!data?.text) throw new Error("Generator returned no content.");

    await TopicDetail.updateOne(
      { courseTitle, moduleName, topic },
      {
        $set: {
          text: Array.isArray(data.text) ? data.text : [String(data.text)],
          videos: data.videos || [],
          mcqs: data.mcqs || [],
          extraQuestions: data.extraQuestions || [],
          status: "completed",
          isPriority: false,
        },
      },
      { upsert: true }
    );

    console.log(`💾 [DB] Topic saved: "${topic}" ✅`);
    return { success: true };
  } catch (err) {
    console.error(`❌ [Topic Worker] Failed "${topic}":`, err.message);
    await TopicDetail.updateOne(
      { courseTitle, moduleName, topic },
      { $set: { status: "failed", isPriority: false } },
      { upsert: true }
    );
    throw err;
  }
}

// 🧠 Worker with concurrency control
new Worker("topic-generation", processTopic, {
  connection,
  concurrency: 1, // sequential ensures delay is respected
});
