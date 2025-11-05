const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true },
  },
  { timestamps: true } // ✅ adds createdAt automatically
);

module.exports = mongoose.model("Course", courseSchema);
