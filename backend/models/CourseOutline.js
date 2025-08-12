const mongoose = require("mongoose");

const ModuleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  submodules: [{ type: String, required: true }],
});

const CourseOutlineSchema = new mongoose.Schema({
  courseTitle: { type: String, required: true, unique: true },
  modules: [ModuleSchema],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("CourseOutline", CourseOutlineSchema);
