require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();

// --------------------------------------------
// 🌐 CORS Setup
// --------------------------------------------
app.use(
  cors({
    origin: [
      "http://localhost:3000", // local frontend
      "https://text-to-learn-ai-powered-course-gen.vercel.app", // deployed frontend
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Handle preflight requests globally
app.options("*", cors());

// --------------------------------------------
// 🧱 Middleware
// --------------------------------------------
app.use(express.json());
mongoose.set("strictQuery", false);

// --------------------------------------------
// 🧠 MongoDB Connection
// --------------------------------------------
(async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error("❌ MONGODB_URI missing in .env");
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log("✅ MongoDB connected successfully");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  }
})();

// --------------------------------------------
// 🏁 Root Route
// --------------------------------------------
app.get("/", (req, res) => {
  res.send("🚀 AI Course Generator Backend is running smoothly!");
});

// --------------------------------------------
// 🧩 Import All Routes
// --------------------------------------------
const usersRoute = require("./routes/users");
const coursesRoute = require("./routes/courses");
const generateNameRoute = require("./routes/generate_name"); // POST /api/generate-name
const generateOutlineRoute = require("./routes/generate_outline"); // GET /api/generate_outline/check/:courseTitle
const topicDetailsRoute = require("./routes/topic_details"); // POST /api/topic_details/priority + GET /api/topic_details/check
const topicCheckRoute = require("./routes/topic_check"); // For polling topic generation progress

// --------------------------------------------
// 🧠 API Routes — Organized by Functionality
// --------------------------------------------

// 👤 User Management
app.use("/api/users", usersRoute);

// 📚 Courses
app.use("/api/courses", coursesRoute);

// 🎓 Course Name → Outline Generation
app.use("/api/generate-name", generateNameRoute);

// 🧭 Outline Generation + Status Check
app.use("/api/generate_outline", generateOutlineRoute);

// 🧠 Topic Details (normal + priority)
app.use("/api/topic_details", topicDetailsRoute);
app.use("/api/topic_check", topicCheckRoute);

// --------------------------------------------
// ❌ 404 Route (Not Found)
// --------------------------------------------
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// --------------------------------------------
// 💥 Global Error Handler
// --------------------------------------------
app.use((err, req, res, next) => {
  console.error("🔥 Unhandled error:", err.stack || err);
  res.status(500).json({ error: "Internal server error" });
});

// --------------------------------------------
// 🚀 Start Server
// --------------------------------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🌍 Server running on port ${PORT}`));
