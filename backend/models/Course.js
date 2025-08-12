const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema({
  userId: { type: String, required: true },  // associate course with a user
  title: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Course", courseSchema);
