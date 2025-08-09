import React, { useState } from "react";
import "./CourseInput.css";

function CourseInput({ inputText, setInputText, onAdd }) {
  const [loading, setLoading] = useState(false);

  // Use environment variable for backend URL fallback to localhost for dev
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000";

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  const handleAdd = async () => {
    const trimmed = inputText.trim();
    if (!trimmed) return;

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/generate_name`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ userInput: trimmed })
      });

      const data = await response.json();

      console.log("🌐 Backend response:", data);

      if (response.ok && data?.suggestion) {
        onAdd(data.suggestion); // Use AI-generated title
      } else {
        console.warn("⚠️ Fallback to user input");
        onAdd(trimmed);
      }
    } catch (error) {
      console.error("❌ AI API failed:", error);
      onAdd(trimmed);
    }

    setInputText(""); // Clear input properly
    setLoading(false);
  };

  return (
    <div className="search-bar">
      <input
        type="text"
        placeholder="Enter course name..."
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        onKeyDown={handleKeyDown}
        aria-label="Enter course name"
        disabled={loading}
      />
      <button onClick={handleAdd} disabled={loading}>
        {loading ? "Generating..." : "Add"}
      </button>
    </div>
  );
}

export default CourseInput;
