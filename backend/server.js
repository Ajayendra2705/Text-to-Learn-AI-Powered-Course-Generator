require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

// Route imports
const usersRoute = require("./routes/users");
const generateRoute = require("./routes/generate_name");
const coursesRoute = require("./routes/courses");
const generateOutlineRoute = require("./routes/generate_outline");
const topicDetailsRoute = require("./routes/topic_details"); // <-- Add this line

const app = express();

// CORS setup
app.use(
  cors({
    origin: "http://localhost:3000", // React frontend URL
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Handle preflight requests globally for all routes
app.options("*", cors());

// Middleware for JSON parsing
app.use(express.json());

// Mongoose strict query fix (recommended for newer versions)
mongoose.set("strictQuery", false);

// MongoDB connection with async/await pattern & better error handling
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
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  }
})();

// Basic root route
app.get("/", (req, res) => {
  res.send("API is running.");
});

// API routes
app.use("/api/users", usersRoute);
app.use("/api/generate_name", generateRoute);
app.use("/api/courses", coursesRoute);
app.use("/api/generate_outline", generateOutlineRoute);
app.use("/api/topic_details", topicDetailsRoute);  // <-- Mount new route here

// 404 handler for unknown routes (optional but recommended)
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Global error handler middleware
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
