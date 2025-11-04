import React, { useState } from "react";
import "./CourseInput.css";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

function CourseInput({ inputText, setInputText, onAdd }) {
  const [loading, setLoading] = useState(false);

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
      const response = await fetch(`${BACKEND_URL}/api/generate_name`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userInput: trimmed }),
      });

      const data = await response.json();

      if (response.ok && data?.suggestion) {
        onAdd(data.suggestion);
      } else {
        console.error("API error or invalid response:", data);
        onAdd(trimmed);
      }
    } catch (error) {
      console.error("Fetch error:", error);
      onAdd(trimmed);
    } finally {
      setLoading(false);
      setInputText("");
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
        aria-label="Course name input"
      />
      <button onClick={handleAdd} disabled={loading} aria-label="Add course">
        {loading ? "Generating..." : "Add"}
      </button>
    </div>
  );
}

export default CourseInput;
