import React from "react";
import "./RightPanel.css";

function RightPanel({ topicLoading, selectedTopic }) {
  return (
    <div id="right-panel">
      {topicLoading ? (
        <p id="loading-text">Loading topic details...</p>
      ) : selectedTopic ? (
        <div id="topic-details">
          <h2 id="topic-title">{selectedTopic.title}</h2>

          <p id="topic-description">
            {selectedTopic.content || selectedTopic.description}
          </p>

          {/* Videos */}
          {selectedTopic.videos?.length > 0 && (
            <div id="videos-section" className="content-card">
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
            <div id="mcq-section" className="content-card">
              <h3>📝 Practice MCQs</h3>
              {selectedTopic.mcqs.map((q, idx) => (
                <div key={idx} className="mcq-box">
                  <p>
                    <strong>Q{idx + 1}:</strong> {q.question}
                  </p>
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
        <p id="placeholder-text">Select a topic to see details</p>
      )}
    </div>
  );
}

export default RightPanel;
