// backend/services/queueTopics.js
// After an outline is ready, queue background generation for every topic
// that isn't already completed. Shared by the normal and priority outline workers.
const { topicQueue } = require("../queues/courseQueue");
const TopicDetail = require("../models/TopicDetail");

async function queueTopicsForOutline(courseTitle, modules) {
  let enqueued = 0;
  for (const mod of modules) {
    const moduleName = mod.title;
    for (const topic of mod.submodules || []) {
      if (!topic || typeof topic !== "string") continue;

      const existing = await TopicDetail.findOne({
        courseTitle,
        moduleName,
        topic,
        status: "completed",
      }).lean();

      if (existing) {
        console.log(`⏭️ [Skip] Topic already exists: "${topic}" (${moduleName})`);
        continue;
      }

      await topicQueue.add(
        "generate-topic",
        { courseTitle, moduleName, topic },
        { removeOnComplete: true }
      );
      enqueued++;
    }
  }
  console.log(`🚀 Queued ${enqueued} background topics for "${courseTitle}"`);
  return enqueued;
}

module.exports = { queueTopicsForOutline };
