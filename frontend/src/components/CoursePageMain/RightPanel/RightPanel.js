import React, { useEffect, useState } from "react";
import './RightPanel.css';

export default function RightPanel({ selectedSubmodule }) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

useEffect(() => {
  if (!selectedSubmodule) {
    setDetails(null);
    return;
  }

  const fetchTopicDetails = async () => {
    setLoading(true);
    setError(null);
    setDetails(null);

    const BACKEND_URL = "https://text-to-learn-ai-powered-course.onrender.com";

    try {
      const res = await fetch(`${BACKEND_URL}/api/topic_details`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: selectedSubmodule }),
      });

      if (!res.ok) throw new Error("Failed to fetch topic details");

      const data = await res.json();
      setDetails(data);
    } catch (err) {
      setError(err.message || "Error fetching topic details");
    } finally {
      setLoading(false);
    }
  };

  fetchTopicDetails();
}, [selectedSubmodule]);

  if (!selectedSubmodule) {
    return (
      <div id="right-panel">
        <p className="info-text">Select a submodule on the left to see details here.</p>
      </div>
    );
  }

  return (
    <div id="right-panel">
      <h2>{selectedSubmodule}</h2>

      {loading && <p className="loading-text">Loading details...</p>}
      {error && <p className="error-text">{error}</p>}

      {details && (
        <div className="topic-details">
          {/* Text paragraphs */}
          {details.text && details.text.map((para, i) => <p key={i}>{para}</p>)}

          {/* YouTube videos */}
          {details.videos && details.videos.length > 0 && (
            <>
              <h3>YouTube Videos:</h3>
              <ul>
                {details.videos.map((url, i) => (
                  <li key={i}>
                    <a href={url} target="_blank" rel="noopener noreferrer">
                      {url}
                    </a>
                  </li>
                ))}
              </ul>
            </>
          )}

          {/* MCQs */}
          {details.mcqs && details.mcqs.length > 0 && (
            <>
              <h3>MCQs:</h3>
              <ul>
                {details.mcqs.map((mcq, i) => (
                  <li key={i}>
                    <p><b>Q:</b> {mcq.question}</p>
                    <ul>
                      {mcq.options.map((opt, idx) => (
                        <li key={idx}>{opt}</li>
                      ))}
                    </ul>
                    <p><i>Answer:</i> {mcq.answer}</p>
                  </li>
                ))}
              </ul>
            </>
          )}

          {/* Extra questions */}
          {details.extraQuestions && details.extraQuestions.length > 0 && (
            <>
              <h3>Extra Questions:</h3>
              <ul>
                {details.extraQuestions.map((q, i) => (
                  <li key={i}>{q}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}
