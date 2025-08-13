import React, { useEffect, useState, useRef } from "react";
import "./RightPanel.css";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function RightPanel({ selectedSubmodule }) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const BACKEND_URL = "https://text-to-learn-ai-powered-course.onrender.com";
  const contentRef = useRef(null); // ✅ Ref for capturing content

  useEffect(() => {
    if (!selectedSubmodule) {
      setDetails(null);
      return;
    }

    const fetchDetails = async () => {
      setLoading(true);
      setError(null);
      setDetails(null);

      try {
        const dbRes = await fetch(
          `${BACKEND_URL}/api/topic_details/get/${encodeURIComponent(selectedSubmodule)}`
        );

        if (dbRes.ok) {
          const dbData = await dbRes.json();
          setDetails(dbData);
          setLoading(false);
          return;
        }

        const aiRes = await fetch(`${BACKEND_URL}/api/topic_details`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topic: selectedSubmodule }),
        });

        if (!aiRes.ok) throw new Error("Failed to fetch topic details");

        const aiData = await aiRes.json();
        setDetails(aiData);

        await fetch(`${BACKEND_URL}/api/topic_details/save`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topic: selectedSubmodule,
            details: aiData,
          }),
        });
      } catch (err) {
        setError(err.message || "Error fetching topic details");
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [selectedSubmodule]);

  // ✅ Function to download as PDF
  const downloadPDF = () => {
    const input = contentRef.current;
    if (!input) return;

    // Store original inline style
    const originalStyles = input.style.cssText;

    // Force all text in this section to black
    input.style.color = "black";
    input.querySelectorAll("*").forEach(el => {
      el.style.color = "black";
    });

    html2canvas(input, { scale: 2 }).then((canvas) => {
      // Restore original styles
      input.style.cssText = originalStyles;
      input.querySelectorAll("*").forEach(el => {
        el.style.color = "";
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 190;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 10;

      pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`${selectedSubmodule}.pdf`);
    });
  };

  if (!selectedSubmodule) {
    return (
      <div id="right-panel">
        <p className="info-text">
          Select a submodule on the left to see details here.
        </p>
      </div>
    );
  }

  return (
    <div id="right-panel">
      <h2>{selectedSubmodule}</h2>

      {loading && <p className="loading-text">Loading details...</p>}
      {error && <p className="error-text">{error}</p>}

      {details && (
        <>
          <button className="download-btn" onClick={downloadPDF}>
            📄 Download as PDF
          </button>

          <div className="topic-details" ref={contentRef}>
            {details.text &&
              details.text.map((para, i) => <p key={i}>{para}</p>)}

            {details.videos?.length > 0 && (
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

            {details.mcqs?.length > 0 && (
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

            {details.extraQuestions?.length > 0 && (
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
        </>
      )}
    </div>
  );
}
