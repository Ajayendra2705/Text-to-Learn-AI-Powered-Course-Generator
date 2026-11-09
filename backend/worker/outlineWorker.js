require("dotenv").config({ path: "../.env" });
const { Worker } = require("bullmq");
const mongoose = require("mongoose");
const { connection, topicQueue } = require("../queues/courseQueue");
const { generateCourseOutline } = require("../services/OutlineGenerator");
const CourseOutline = require("../models/CourseOutline");
const TopicDetail = require("../models/TopicDetail");

console.log("⚡ Starting Normal Outline Worker...");

// 🧠 MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB connected (Outline Worker)"))
  .catch((e) => {
    console.error("❌ MongoDB connection failed:", e.message);
    process.exit(1);
  });

// 🧠 Worker Logic
async function processOutline(job) {
  const { courseId, courseTitle } = job.data;
  console.log(`⚙️ [Outline Worker] Generating outline for "${courseTitle}"`);

  try {
    // Step 1: Mark status as generating
    await CourseOutline.findByIdAndUpdate(courseId, {
      $set: { status: "generating", isPriority: false },
    });

    // Step 2: Generate outline from AI
    const outlineData = await generateCourseOutline(courseTitle);
    if (!outlineData || !outlineData.modules?.length)
      throw new Error("Empty outline returned by generator.");

    // Step 3: Normalize structure (AI outputs vary)
    const normalizedModules = outlineData.modules.map((mod, i) => ({
      title:
        mod.title?.trim() ||
        mod.moduleTitle?.trim() ||
        `Module ${i + 1}`,
      submodules:
        mod.submodules?.length
          ? mod.submodules
          : mod.topics?.length
          ? mod.topics
          : mod.sections?.length
          ? mod.sections
          : [],
    }));

    // Step 4: Save normalized outline to Mongo
    await CourseOutline.findByIdAndUpdate(courseId, {
      $set: {
        modules: normalizedModules,
        status: "completed",
        isPriority: false,
      },
    });

    console.log(
      `✅ [DB] Outline saved for "${courseTitle}" with ${normalizedModules.length} modules`
    );

    // Step 5: Queue topic generation jobs (only if not existing)
    let enqueued = 0;
    for (const mod of normalizedModules) {
      const moduleName = mod.title;
      for (const topic of mod.submodules) {
        // ensure non-empty strings
        if (!topic || typeof topic !== "string") continue;

        const existing = await TopicDetail.findOne({
          courseTitle,
          moduleName,
          topic,
        }).lean();

        if (!existing) {
          await topicQueue.add(
            "generate-topic",
            { courseTitle, moduleName, topic },
            { removeOnComplete: true }
          );
          enqueued++;
        } 
        else {
          console.log(`⏭️ [Skip] Topic already exists: "${topic}" (${moduleName})`);
        }
      }
    }

    console.log(
      `🚀 [Outline Worker] Queued ${enqueued} new topics for "${courseTitle}"`
    );

    return { success: true, queued: enqueued };
  } catch (err) {
    console.error(
      `❌ [Outline Worker] Failed for "${courseTitle}":`,
      err.message
    );

    await CourseOutline.findByIdAndUpdate(courseId, {
      $set: { status: "failed" },
    });

    throw err;
  }
}

// 🧩 Create BullMQ Worker
new Worker("outline-generation", processOutline, {
  connection,
  concurrency: 2,
});
