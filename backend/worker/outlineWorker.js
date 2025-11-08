require("dotenv").config({ path: "../.env" });
const { Worker } = require("bullmq");
const IORedis = require("ioredis");
const mongoose = require("mongoose");
const { generateCourseOutline } = require("../services/OutlineGenerator");
const {
  topicQueue,
  priorityTopicQueue,
} = require("../queues/courseQueue");
const CourseOutline = require("../models/CourseOutline");
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
  .then(() => console.log("✅ MongoDB connected (Outline Worker)"))
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  });

// ----------------------
// ⚙️ Common Job Handler
// ----------------------
async function processOutlineJob(job, queueType) {
  const { courseId, courseTitle } = job.data;
  const priority = job.opts.priority || (queueType === "PRIORITY" ? 1 : 5);

  console.log(
    `⚙️ [${queueType}] Generating outline for "${courseTitle}" (priority ${priority})`
  );

  const course = await CourseOutline.findById(courseId);
  if (!course) throw new Error(`Course not found for ID: ${courseId}`);

  await CourseOutline.findByIdAndUpdate(courseId, {
    $set: { status: queueType === "PRIORITY" ? "prioritized" : "generating" },
  });

  try {
    // 🧠 Generate Outline via Cohere
    const outlineData = await generateCourseOutline(courseTitle);

    // 💾 Save Outline in Database
    await CourseOutline.findByIdAndUpdate(courseId, {
      $set: { modules: outlineData.modules, status: "completed" },
    });

    console.log(`✅ [${queueType}] Outline completed for "${courseTitle}"`);

    // 🧩 Queue Topic Generation (inherits priority)
    let queuedCount = 0;
    const queue = queueType === "PRIORITY" ? priorityTopicQueue : topicQueue;

    for (const mod of outlineData.modules) {
      for (const sub of mod.submodules) {
        // ✅ Skip if topic already exists in DB
        const existing = await TopicDetail.findOne({
          courseTitle,
          moduleName: mod.title,
          topic: sub,
        });
        if (existing) {
          console.log(`⚠️ [${queueType}] Skipping existing topic "${sub}"`);
          continue;
        }

        // ✅ Unique Job ID — prevents duplicates in queue
        const jobId = `${courseTitle}_${mod.title}_${sub}`
          .replace(/[^a-zA-Z0-9_-]/g, "_")
          .substring(0, 150); // prevent long IDs

        // ✅ Add to the correct queue
        await queue.add(
          "generate-topic",
          {
            courseId,
            courseTitle,
            moduleTitle: mod.title,
            topicTitle: sub,
          },
          {
            jobId,
            priority,
            removeOnComplete: true, // auto cleanup
            removeOnFail: true,     // cleanup failed jobs after logging
            attempts: 2,
          }
        );

        queuedCount++;
      }
    }

    console.log(
      `🧩 [${queueType}] Queued ${queuedCount} new topics for "${courseTitle}"`
    );
  } catch (err) {
    console.error(`❌ [${queueType}] Outline generation failed:`, err.message);
    await CourseOutline.findByIdAndUpdate(courseId, {
      $set: { status: "failed" },
    });
  }
}

// ----------------------
// 🧠 Workers
// ----------------------

// 🕓 Normal background outline jobs
new Worker(
  "outline-generation",
  async (job) => await processOutlineJob(job, "NORMAL"),
  { connection, concurrency: 2 }
);

// ⚡ High-priority outline jobs
new Worker(
  "priority-outline-generation",
  async (job) => await processOutlineJob(job, "PRIORITY"),
  { connection, concurrency: 2 }
);

// ----------------------
// 🎯 Cleanup
// ----------------------
process.on("SIGINT", async () => {
  console.log("\n🧹 Shutting down Outline Worker...");
  await connection.quit();
  await mongoose.disconnect();
  console.log("👋 Worker stopped cleanly");
  process.exit(0);
});
