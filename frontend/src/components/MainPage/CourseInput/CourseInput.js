import React, { useState } from "react";
import { apiFetch } from "../../../api";
import "./CourseInput.css";


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
      // ✅ 1) Generate AI name (correct endpoint with hyphen)
      const genRes = await apiFetch(`/api/generate-name`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userInput: trimmed }),
      });

      // even if backend fails, we'll fall back to user input
      let finalTitle = trimmed;
      if (genRes.ok) {
        const genData = await genRes.json();
        finalTitle = genData?.suggestion?.trim() || trimmed;
      }

      // ✅ 2) Delegate saving to parent (HomePage)
      //    This avoids double-POSTing to /api/courses
      onAdd(finalTitle);
    } 
    catch (error) {
      console.error("❌ Name generation error:", error);
      onAdd(trimmed); // graceful fallback
    } 
    finally {
      setInputText("");
      setLoading(false);
    }
  };

  const disabled = loading || !inputText.trim();

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
      <button onClick={handleAdd} disabled={disabled}>
        {loading ? "Generating..." : "Add"}
      </button>
    </div>
  );
}

export default CourseInput;
