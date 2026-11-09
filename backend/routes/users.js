// routes/users.js
const express = require("express");
const router = express.Router();
const User = require("../models/User");

router.post("/", async (req, res) => {
  // uid/email come from the verified token, not the request body (can't sync as someone else)
  const uid = req.uid;
  const email = req.email || req.body.email;
  const { displayName } = req.body;
  if (!uid || !email) {
    return res.status(400).json({ error: "Missing uid or email" });
  }

  try {
    let user = await User.findOne({ uid });
    if (user) {
      // Update existing user info if needed
      user.email = email;
      user.displayName = displayName || "";
      await user.save();
    } else {
      // Create new user
      user = new User({ uid, email, displayName });
      await user.save();
    }
    res.status(200).json({ message: "User synced successfully", user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
