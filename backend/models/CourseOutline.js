const mongoose = require("mongoose");

const ModuleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    submodules: {
      type: [String],
      default: [],
    },
  },
  { _id: false } // prevent nested _id for subdocs
);

const CourseOutlineSchema = new mongoose.Schema(
  {
    // 🎓 Unique title of the course
    courseTitle: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    // 📘 AI-generated module outline
    modules: {
      type: [ModuleSchema],
      default: [],
    },

    // ⚙️ Outline generation state
    status: {
      type: String,
      enum: ["queued", "generating", "completed", "failed"],
      default: "queued",
    },

    // 🔥 Indicates if generated through the priority queue
    isPriority: {
      type: Boolean,
      default: false,
      index: true, // speeds up filtering for analytics
    },

    // 🔢 Numeric priority (for future scaling/analytics)
    priority: {
      type: Number,
      min: 1,
      max: 10,
      default: 5,
    },

    // 🧠 AI meta info (optional — useful for debugging)
    aiMetadata: {
      promptTokens: { type: Number, default: 0 },
      completionTokens: { type: Number, default: 0 },
      model: { type: String, default: "" },
      durationMs: { type: Number, default: 0 },
    },

    // ⚠️ Error tracking for failed jobs
    errorLog: {
      message: { type: String },
      stack: { type: String },
      timestamp: { type: Date },
    },
  },
  {
    versionKey: false,
    timestamps: true, // adds createdAt, updatedAt
  }
);

// ✅ Index for quick lookups and analytics
CourseOutlineSchema.index({ courseTitle: 1 }, { unique: true });
CourseOutlineSchema.index({ status: 1 });
CourseOutlineSchema.index({ isPriority: 1 });
CourseOutlineSchema.index({ updatedAt: -1 });

module.exports = mongoose.model("CourseOutline", CourseOutlineSchema);
