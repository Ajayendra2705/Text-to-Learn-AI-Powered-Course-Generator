// backend/workers/priorityOutlineWorker.js
require("dotenv").config({ path: "../.env" });
const { Worker } = require("bullmq");
const mongoose = require("mongoose");
const { connection } = require("../queues/priorityCourseQueue");
const { generateCourseOutline } = require("../services/OutlineGenerator");
const CourseOutline = require("../models/CourseOutline");

// 🧩 MongoDB connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB connected (Priority Outline Worker)"))
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  });

// ⏳ Utility to delay between jobs (helps avoid AI rate limits)
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 🧠 Main Processor Function
async function processPriorityOutline(job) {
  const { courseId, courseTitle } = job.data;
  const attempt = job.attemptsMade + 1;

  if (!courseTitle || typeof courseTitle !== "string") {
    console.warn("⚠️ Invalid job data, missing courseTitle.");
    return;
  }

  console.log(`⚙️ [Priority Worker] (${attempt}) Processing "${courseTitle}"...`);

  try {
    // Step 1️⃣: Retrieve or create document
    let courseDoc = null;

    if (courseId) {
      courseDoc = await CourseOutline.findById(courseId);
    }

    if (!courseDoc) {
      courseDoc = await CourseOutline.create({
        courseTitle,
        status: "generating",
        isPriority: true,
      });
    } else {
      await CourseOutline.updateOne(
        { _id: courseDoc._id },
        { $set: { status: "generating", isPriority: true }, $unset: { errorLog: "" } }
      );
    }

    // 💤 Small delay to prevent overloading AI API
    console.log(`⏳ Waiting 5 seconds before AI call for "${courseTitle}"...`);
    await sleep(5000);

    // Step 2️⃣: Generate outline using AI
    const start = Date.now();
    const outlineData = await generateCourseOutline(courseTitle);
    const duration = Date.now() - start;

    console.log(`🧠 [AI] Outline generated for "${courseTitle}" in ${duration} ms`);

    if (!outlineData?.modules?.length) {
      throw new Error("AI returned empty module list.");
    }

    // Step 3️⃣: Save successful result
    await CourseOutline.updateOne(
      { _id: courseDoc._id },
      {
        $set: {
          modules: outlineData.modules,
          status: "completed",
          isPriority: true,
          aiMetadata: {
            durationMs: duration,
            model: outlineData.model || "unknown",
            promptTokens: outlineData.promptTokens || 0,
            completionTokens: outlineData.completionTokens || 0,
          },
        },
      }
    );

    console.log(`✅ [DB] Priority outline saved for "${courseTitle}"`);
    return { success: true, modules: outlineData.modules };
  } catch (err) {
    const msg = err?.message || "Unknown error";
    console.error(`❌ [Priority Worker] Failed for "${courseTitle}": ${msg}`);

    // Step 4️⃣: Update DB with error details
    await CourseOutline.findOneAndUpdate(
      { courseTitle },
      {
        $set: {
          status: "failed",
          isPriority: true,
          errorLog: {
            message: msg,
            stack: err?.stack || "",
            timestamp: new Date(),
          },
        },
      },
      { upsert: true }
    );

    // Allow BullMQ to retry this job
    throw err;
  }
}

// 🧰 Create Worker Instance
const priorityOutlineWorker = new Worker(
  "priority-outline-generation",
  processPriorityOutline,
  {
    connection,
    concurrency: 2,
    removeOnComplete: { age: 3600 },
    removeOnFail: { age: 86400 },
  }
);

// 🧾 Event Logging
priorityOutlineWorker
  .on("completed", (job) =>
    console.log(`✅ Job completed for "${job.data.courseTitle}"`)
  )
  .on("failed", (job, err) =>
    console.error(
      `❌ Job failed for "${job?.data?.courseTitle || "unknown"}": ${err.message}`
    )
  )
  .on("error", (err) => console.error("💥 Worker internal error:", err.message));

console.log("⚡ Priority Outline Worker running and waiting for jobs...");
