import React, { useState } from "react";
import "./CourseInput.css";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

function CourseInput({ inputText, setInputText, onAdd, userId }) {
  const [loading, setLoading] = useState(false);

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  const handleAdd = async () => {
    const trimmed = inputText.trim();
    if (!trimmed || loading) return;

    setLoading(true);

    try {
      // 🧠 Step 1 — Ask AI for a professional course name
      const genRes = await fetch(`${BACKEND_URL}/api/generate_name`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userInput: trimmed }),
      });

      const genData = await genRes.json();
      const finalTitle = genData?.suggestion || trimmed;

      // 🧠 Step 2 — Save to DB
      const saveRes = await fetch(`${BACKEND_URL}/api/courses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, title: finalTitle }),
      });

      const savedCourse = await saveRes.json();

      if (saveRes.ok && savedCourse?._id) {
        onAdd(savedCourse);
      } else {
        console.error("⚠️ Failed to save course:", savedCourse);
        onAdd({ title: finalTitle }); // fallback
      }
    } catch (error) {
      console.error("❌ Fetch error:", error);
      onAdd({ title: trimmed }); // fallback safe add
    } finally {
      setInputText("");
      setLoading(false);
    }
  };

  return (
    <div className="search-bar">
      <input
        type="text"
        placeholder="Enter course name..."
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={loading}
      />
      <button onClick={handleAdd} disabled={loading}>
        {loading ? "Generating..." : "Add"}
      </button>
    </div>
  );
}

export default CourseInput;
