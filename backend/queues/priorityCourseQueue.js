// backend/queues/priorityCourseQueue.js
require("dotenv").config({ path: "../.env" });
const { Queue } = require("bullmq");
const IORedis = require("ioredis");

// 🧩 Shared Redis Connection (singleton)
let connection;

if (!global._priorityRedisConnection) {
  connection = new IORedis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    tls: process.env.REDIS_URL?.startsWith("rediss://")
      ? { rejectUnauthorized: false }
      : undefined,
  });

  connection.on("connect", () =>
    console.log("⚡ Connected to Redis (priority queues)")
  );

  connection.on("error", (err) =>
    console.error("❌ Redis error (priority queues):", err.message)
  );

  global._priorityRedisConnection = connection;
} else {
  connection = global._priorityRedisConnection;
}

// 🧱 Define Queues
const priorityOutlineQueue = new Queue("priority-outline-generation", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 3000 },
    removeOnComplete: true,
    removeOnFail: false,
    priority: 1,
  },
});

const priorityTopicQueue = new Queue("priority-topic-generation", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 3000 },
    removeOnComplete: true,
    removeOnFail: false,
    priority: 1,
  },
});

module.exports = { connection, priorityOutlineQueue, priorityTopicQueue };
