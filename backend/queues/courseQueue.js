require("dotenv").config({ path: "../.env" });
const { Queue } = require("bullmq");
const IORedis = require("ioredis");

const connection = new IORedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
  tls: process.env.REDIS_URL.startsWith("rediss://")
    ? { rejectUnauthorized: false }
    : undefined,
});

console.log("🔗 Connected to Redis for queues");

const outlineQueue = new Queue("outline-generation", {
  connection,
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: false,
  },
});

const topicQueue = new Queue("topic-generation", {
  connection,
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: false,
  },
});

module.exports = { outlineQueue, topicQueue };
