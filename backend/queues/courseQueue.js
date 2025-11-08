require("dotenv").config({ path: "../.env" });
const { Queue } = require("bullmq");
const IORedis = require("ioredis");

// ✅ Redis Connection
const connection = new IORedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
  tls: process.env.REDIS_URL.startsWith("rediss://")
    ? { rejectUnauthorized: false }
    : undefined,
});

console.log("🔗 Connected to Redis for BullMQ queues");

// ✅ Helper: Base default job options
const defaultJobOptions = {
  removeOnComplete: true, // automatically delete successful jobs
  removeOnFail: true,     // delete failed jobs after inspection
  attempts: 2,            // retry once in case of transient network error
};

// 🟢 NORMAL PRIORITY QUEUES (Background tasks)
const outlineQueue = new Queue("outline-generation", {
  connection,
  defaultJobOptions: { ...defaultJobOptions, priority: 5 },
});

const topicQueue = new Queue("topic-generation", {
  connection,
  defaultJobOptions: { ...defaultJobOptions, priority: 5 },
});

// ⚡ HIGH PRIORITY QUEUES (User-triggered tasks)
const priorityOutlineQueue = new Queue("priority-outline-generation", {
  connection,
  defaultJobOptions: { ...defaultJobOptions, priority: 1 },
});

const priorityTopicQueue = new Queue("priority-topic-generation", {
  connection,
  defaultJobOptions: { ...defaultJobOptions, priority: 1 },
});

// ✅ Export all queues
module.exports = {
  outlineQueue,
  topicQueue,
  priorityOutlineQueue,
  priorityTopicQueue,
};
