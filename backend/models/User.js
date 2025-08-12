// models/User.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  displayName: { type: String, default: "" },
  // Add any additional fields here
});

module.exports = mongoose.model("User", userSchema);
