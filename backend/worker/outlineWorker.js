require("dotenv").config({ path: "../.env" });
const { Worker } = require("bullmq");
const IORedis = require("ioredis");
const mongoose = require("mongoose");
const { generateCourseOutline } = require("../services/OutlineGenerator");
const { topicQueue } = require("../queues/courseQueue");
const CourseOutline = require("../models/CourseOutline");

const connection = new IORedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
  tls: process.env.REDIS_URL.startsWith("rediss://")
    ? { rejectUnauthorized: false }
    : undefined,
});

mongoose.connect(process.env.MONGODB_URI).then(() => {
  console.log("✅ MongoDB connected (Outline Worker)");
});

const worker = new Worker(
  "outline-generation",
  async (job) => {
    const { courseId, courseTitle } = job.data;
    console.log(`⚙️ [Worker] Generating outline for "${courseTitle}"`);

    const course = await CourseOutline.findById(courseId);
    if (!course) throw new Error("Course not found");

    await CourseOutline.findByIdAndUpdate(courseId, {
      $set: { status: "generating" },
    });

    try {
      const outlineData = await generateCourseOutline(courseTitle);
      await CourseOutline.findByIdAndUpdate(courseId, {
        $set: { modules: outlineData.modules, status: "completed" },
      });

      console.log(`✅ [Worker] Outline completed for "${courseTitle}"`);

      // Queue each topic generation
      for (const mod of outlineData.modules) {
        for (const sub of mod.submodules) {
          await topicQueue.add("generate-topic", {
            courseId,
            courseTitle,
            moduleTitle: mod.title,
            topicTitle: sub,
          });
        }
      }

      console.log(`🧩 [Queue] Queued all topic generations for "${courseTitle}"`);
    } catch (err) {
      console.error(`❌ [Worker] Outline generation failed:`, err.message);
      await CourseOutline.findByIdAndUpdate(courseId, {
        $set: { status: "failed" },
      });
    }
  },
  { connection }
);

worker.on("completed", (job) =>
  console.log(`🎉 [Worker] Outline job done: ${job.data.courseTitle}`)
);
worker.on("failed", (job, err) =>
  console.error(`💥 [Worker] Outline job failed: ${job.data.courseTitle}`, err.message)
);
