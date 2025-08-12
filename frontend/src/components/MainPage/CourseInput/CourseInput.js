import React, { useState } from "react";
import "./CourseInput.css";

function CourseInput({ inputText, setInputText, onAdd }) {
  const [loading, setLoading] = useState(false);
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

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
      const response = await fetch(`${API_BASE_URL}/api/generate_name`, { // <-- fixed path
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userInput: trimmed }),
      });

      const data = await response.json();
      console.log(`Backend gave: ${JSON.stringify(data)}`);
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
      />
      <button onClick={handleAdd} disabled={loading}>
        {loading ? "Generating..." : "Add"}
      </button>
    </div>
  );
}

export default CourseInput;
