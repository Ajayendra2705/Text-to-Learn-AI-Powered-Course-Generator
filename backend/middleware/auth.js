// backend/middleware/auth.js
// Verifies the Firebase ID token sent by the frontend as "Authorization: Bearer <token>"
// and exposes the verified user id as req.uid.
// Only the (public) project id is needed to verify tokens — no service account key.
const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID || "ai-course-generator-257c5",
  });
}

async function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Missing auth token" });

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.uid = decoded.uid;
    req.email = decoded.email;
    next();
  } catch (err) {
    console.warn("🔒 [Auth] Invalid token:", err.message);
    res.status(401).json({ error: "Invalid or expired auth token" });
  }
}

module.exports = { requireAuth };
