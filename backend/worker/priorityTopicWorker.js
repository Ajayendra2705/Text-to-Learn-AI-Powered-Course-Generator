require("dotenv").config({ path: "../.env" });
const { Worker } = require("bullmq");
const mongoose = require("mongoose");
const { connection } = require("../queues/priorityCourseQueue");
const { generateTopicDetails } = require("../services/TopicGenerator");
const TopicDetail = require("../models/TopicDetail");

console.log("⚡ Starting Priority Topic Worker...");

// 🧩 Connect MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB connected (Priority Topic Worker)"))
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  });

// ⏳ Utility function to wait N ms
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 🧠 Retry logic for AI calls (handles rate limits)
async function retryAIRequest(fn, retries = 5, delay = 3000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const isRateLimit = err.response?.status === 429;
      if (isRateLimit && attempt < retries) {
        console.warn(`⚠️ Rate limited — retry ${attempt}/${retries} in ${delay}ms`);
        await new Promise((r) => setTimeout(r, delay));
        delay *= 2;
      } else {
        throw err;
      }
    }
  }
}

// 🧩 Worker function
async function processPriorityTopic(job) {
  const { courseTitle, moduleTitle, topicTitle } = job.data;
  console.log(`🧠 [Priority Worker] Generating topic "${topicTitle}"`);

  try {
    // ✅ Check if topic already exists
    const existing = await TopicDetail.findOne({
      courseTitle,
      moduleName: moduleTitle,
      topic: topicTitle,
    });

    if (existing) {
      console.log(`⏭️ [Skip] Topic already exists: "${topicTitle}"`);
      return { cached: true };
    }

    // 💤 Wait 10 seconds before making AI call
    console.log(`⏳ Waiting 10 seconds before AI request for "${topicTitle}"...`);
    await sleep(10000);

    // 🧠 Generate topic via AI with retry logic
    const topicData = await retryAIRequest(() =>
      generateTopicDetails(courseTitle, moduleTitle, topicTitle)
    );

    if (!topicData?.text) {
      throw new Error("AI returned no content.");
    }

    // 💾 Upsert topic data safely
    await TopicDetail.updateOne(
      { courseTitle, moduleName: moduleTitle, topic: topicTitle },
      {
        $set: {
          text: topicData.text,
          videos: topicData.videos || [],
          mcqs: topicData.mcqs || [],
          extraQuestions: topicData.extraQuestions || [],
          status: "completed",
          isPriority: true,
        },
      },
      { upsert: true }
    );

    console.log(`✅ [DB] Priority topic saved: "${topicTitle}"`);
  } catch (err) {
    console.error(`❌ [Priority Worker] Failed for "${topicTitle}":`, err.message);
    await TopicDetail.updateOne(
      { courseTitle, moduleName: moduleTitle, topic: topicTitle },
      { $set: { status: "failed", isPriority: true } },
      { upsert: true }
    );
  }
}

// 🧰 Worker instance
new Worker("priority-topic-generation", processPriorityTopic, {
  connection,
  concurrency: 1, // 🔹 Run 1 job at a time to enforce spacing
});
