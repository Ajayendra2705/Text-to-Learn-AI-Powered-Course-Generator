require("dotenv").config({ path: "../.env" });
const { Queue } = require("bullmq");
const IORedis = require("ioredis");

const connection = new IORedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
  tls: process.env.REDIS_URL.startsWith("rediss://")
    ? { rejectUnauthorized: false }
    : undefined,
});

console.log("🔗 Connected to Redis for topic queues");

// Background queue
const topicQueue = new Queue("topic-generation", {
  connection,
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: false,
    priority: 5,
  },
});

// Priority queue
const priorityTopicQueue = new Queue("priority-topic-generation", {
  connection,
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: false,
    priority: 1,
  },
});

module.exports = { topicQueue, priorityTopicQueue };
