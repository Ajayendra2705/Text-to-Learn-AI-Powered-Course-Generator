require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

// Route imports
const usersRoute = require("./routes/users");
const generateRoute = require("./routes/generate_name");
const coursesRoute = require("./routes/courses");
const generateOutlineRoute = require("./routes/generate_outline");
const topicDetailsRoute = require("./routes/topic_details");

const app = express();

// -----------------------------
// 🔐 CORS setup
// -----------------------------
app.use(
  cors({
    origin: [
      "http://localhost:3000", // local dev frontend
      "https://text-to-learn-ai-powered-course-gen.vercel.app", // deployed frontend
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Handle preflight requests
app.options("*", cors());

// -----------------------------
// 🧩 Middleware
// -----------------------------
app.use(express.json());
mongoose.set("strictQuery", false);

// -----------------------------
// 🧠 MongoDB connection
// -----------------------------
(async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error("❌ MONGODB_URI is not defined in .env");
      process.exit(1);
    }
    await mongoose.connect(mongoUri);
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  }
})();

// -----------------------------
// 🧠 API routes
// -----------------------------
app.get("/", (req, res) => res.send("API is running."));

app.use("/api/users", usersRoute);
app.use("/api/generate_name", generateRoute);
app.use("/api/courses", coursesRoute);
app.use("/api/generate_outline", generateOutlineRoute);
app.use("/api/topic_details", topicDetailsRoute);

// -----------------------------
// ⚠️ 404 handler
// -----------------------------
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// -----------------------------
// 💥 Global error handler
// -----------------------------
app.use((err, req, res, next) => {
  console.error("❌ Unhandled error:", err.message);
  res.status(500).json({ error: "Internal server error" });
});

// -----------------------------
// 🚀 Start server
// -----------------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
