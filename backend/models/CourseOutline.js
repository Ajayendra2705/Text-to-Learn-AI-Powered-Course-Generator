const mongoose = require("mongoose");

const CourseOutlineSchema = new mongoose.Schema(
  {
    // 🎓 Title of the course
    courseTitle: {
      type: String,
      required: true,
      unique: true, // ✅ Prevent duplicate course titles
      trim: true,
    },

    // 📘 Array of modules (auto-filled by AI)
    modules: {
      type: [
        {
          title: { type: String, required: false },
          submodules: { type: [String], default: [] },
        },
      ],
      default: [],
    },

    // ⚙️ Current processing status
    status: {
      type: String,
      enum: ["queued", "generating", "completed", "prioritized", "failed"],
      default: "queued",
    },

    // 🔢 Priority level (1 = highest, 10 = lowest)
    priority: {
      type: Number,
      min: 1,
      max: 10,
      default: 5,
    },
  },
  {
    versionKey: false, // ✅ Disable "__v"
    timestamps: true, // ✅ Adds createdAt, updatedAt
  }
);

// ✅ Index to make title lookups fast and prevent duplicates
CourseOutlineSchema.index({ courseTitle: 1 }, { unique: true });

module.exports = mongoose.model("CourseOutline", CourseOutlineSchema);
