// src/components/RightPanel.js
import React from "react";
import "./RightPanel.css";

function RightPanel({ topicLoading, selectedTopic }) {
  return (
    <div className="right-panel">
      {topicLoading ? (
        <p className="loading-text">Loading topic details...</p>
      ) : selectedTopic ? (
        <div className="topic-details">
          <h2>{selectedTopic.title}</h2>

          <p>{selectedTopic.content || selectedTopic.description}</p>

          {/* Videos */}
          {selectedTopic.videos?.length > 0 && (
            <div className="videos-section">
              <h3>📺 Related Videos</h3>
              <ul>
                {selectedTopic.videos.map((vid, idx) => (
                  <li key={idx}>
                    <a href={vid.url} target="_blank" rel="noopener noreferrer">
                      {vid.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* MCQs */}
            {selectedTopic.mcqs && selectedTopic.mcqs.length > 0 && (
            <div className="mcq-section">
                <h3>📝 Practice MCQs</h3>
                {selectedTopic.mcqs.map((q, idx) => (
                <div key={idx} className="mcq-box">
                    <p><strong>Q{idx + 1}:</strong> {q.question}</p>
                    <ul>
                    {q.options.map((opt, i) => (
                        <li
                        key={i}
                        className="mcq-option"
                        onClick={(e) => {
                            e.target.classList.add(
                            opt === q.answer ? "correct" : "incorrect"
                            );
                        }}
                        >
                        {opt}
                        </li>
                    ))}
                    </ul>
                </div>
                ))}
            </div>
            )}

        </div>
      ) : (
        <p className="placeholder-text">Select a topic to see details</p>
      )}
    </div>
  );
}

export default RightPanel;
