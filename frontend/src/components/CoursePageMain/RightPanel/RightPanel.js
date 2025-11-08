import React, { useEffect, useState, useRef } from "react";
import "./RightPanel.css";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function RightPanel({ selectedItem, courseTitle }) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
  const contentRef = useRef(null);

  useEffect(() => {
    if (!selectedItem) {
      setDetails(null);
      return;
    }

    const { moduleTitle, submoduleName } = selectedItem;

    const fetchDetails = async () => {
      setLoading(true);
      setError(null);
      setDetails(null);

      try {
        // ⚡ Trigger PRIORITY topic generation when viewed
        const res = await fetch(`${BACKEND_URL}/api/topic_details/priority`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topic: submoduleName,
            moduleName: moduleTitle,
            courseTitle,
          }),
        });

        if (!res.ok) throw new Error("Failed to fetch topic details");
        const data = await res.json();

        // If topic still generating — show spinner message
        if (data.status === "prioritized" || data.status === "queued") {
          setDetails({
            text: [`⚙️ The topic "${submoduleName}" is being generated. Please wait a few moments...`],
            videos: [],
            mcqs: [],
            extraQuestions: [],
          });

          // Try again after 10 seconds automatically
          setTimeout(fetchDetails, 10000);
          return;
        }

        setDetails(data);
      } catch (err) {
        setError(err.message || "Error fetching topic details");
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [selectedItem, courseTitle]);

  // 🧾 Download PDF
  const downloadPDF = () => {
    const input = contentRef.current;
    if (!input) return;

    const originalStyles = input.style.cssText;
    input.style.color = "black";
    input.querySelectorAll("*").forEach((el) => (el.style.color = "black"));

    html2canvas(input, { scale: 2 }).then((canvas) => {
      input.style.cssText = originalStyles;
      input.querySelectorAll("*").forEach((el) => (el.style.color = ""));

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

      pdf.save(`${selectedItem.submoduleName}.pdf`);
    });
  };

  if (!selectedItem) {
    return (
      <div id="right-panel">
        <p className="info-text">
          Select a submodule on the left to see details here.
        </p>
      </div>
    );
  }

  const { submoduleName } = selectedItem;

  return (
    <div id="right-panel">
      <h2>{submoduleName}</h2>

      {loading && <p className="loading-text">Loading details...</p>}
      {error && <p className="error-text">{error}</p>}

      {details && (
        <>
          <button className="download-btn" onClick={downloadPDF}>
            📄 Download as PDF
          </button>

          <div className="topic-details" ref={contentRef}>
            {details.text?.map((para, i) => <p key={i}>{para}</p>)}

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
