import React, { useEffect, useState, useRef } from "react";
import { apiFetch } from "../../../api";
import "./RightPanel.css";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function RightPanel({ selectedItem, courseTitle }) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState("");
  const contentRef = useRef(null);

  useEffect(() => {
    if (!selectedItem) {
      setDetails(null);
      setStatus("");
      return;
    }

    const { moduleTitle, submoduleName } = selectedItem;
    setLoading(true);
    setError(null);
    setDetails(null);
    setStatus("queued (priority)");

    // Local to this effect run: if the user clicks another topic while this
    // request is in flight, the stale request must not start/keep a poll that
    // would later overwrite the new topic's content.
    let cancelled = false;
    let pollInterval;

    const queuePriorityTopic = async () => {
      try {
        // 1️⃣ Queue high-priority topic generation
        const res = await apiFetch(`/api/topic_details/priority`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            courseTitle,
            moduleName: moduleTitle,
            topic: submoduleName,
          }),
        });

        if (!res.ok) throw new Error(`Failed to queue topic (${res.status})`);
        const data = await res.json();
        if (cancelled) return;
        console.log("⚡ [Frontend] Queued priority topic:", data);

        if (data.status === "completed" && data.topicDetail) {
          setDetails(data.topicDetail);
          setStatus("completed (cached)");
          setLoading(false);
          return;
        }

        // 2️⃣ Start polling for topic generation
        pollInterval = setInterval(async () => {
          try {
            const checkRes = await apiFetch(
              `/api/topic_details/check/${encodeURIComponent(
                courseTitle
              )}/${encodeURIComponent(moduleTitle)}/${encodeURIComponent(
                submoduleName
              )}`
            );

            if (cancelled || !checkRes.ok) return;
            const checkData = await checkRes.json();
            if (cancelled) return;

            if (checkData && checkData.text?.length > 0) {
              console.log("✅ [Frontend] Topic ready:", checkData);
              setDetails(checkData);
              setStatus("completed (priority)");
              setLoading(false);
              clearInterval(pollInterval);
            } else if (checkData.status === "failed") {
              setError("Topic generation failed. Click the topic again to retry.");
              setLoading(false);
              clearInterval(pollInterval);
            } else {
              console.log("⏳ [Frontend] Still generating topic...");
            }
          } catch (err) {
            console.error("Polling error:", err.message);
          }
        }, 5000);
      } catch (err) {
        if (cancelled) return;
        console.error("❌ [Frontend] Priority queue failed:", err.message);
        setError(err.message);
        setLoading(false);
      }
    };

    queuePriorityTopic();

    // 🧹 Cleanup on topic change
    return () => {
      cancelled = true;
      clearInterval(pollInterval);
    };
  }, [selectedItem, courseTitle]);

  // 🧾 PDF download
  const downloadPDF = () => {
    if (!contentRef.current) return;

    const node = contentRef.current;
    html2canvas(node, { scale: 2 }).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const margin = 10;
      const imgWidth = 190;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const pageContentHeight = pdf.internal.pageSize.getHeight() - margin * 2;

      // Content is usually taller than one A4 page → place the same image on
      // successive pages, shifted up, so nothing gets cut off.
      let offset = 0;
      pdf.addImage(imgData, "PNG", margin, margin, imgWidth, imgHeight);
      while (imgHeight - offset > pageContentHeight) {
        offset += pageContentHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", margin, margin - offset, imgWidth, imgHeight);
      }
      pdf.save(`${selectedItem.submoduleName}.pdf`);
    });
  };

  if (!selectedItem) {
    return (
      <div id="right-panel">
        <p className="info-text">Select a submodule to view details.</p>
      </div>
    );
  }

  return (
    <div id="right-panel">
      <h2>{selectedItem.submoduleName}</h2>

      {loading && (
        <p className="loading-text">
          {status.includes("priority")
            ? "Queued in high-priority worker..."
            : "Generating topic details..."}
        </p>
      )}
      {error && <p className="error-text">{error}</p>}

      {details && (
        <>
          <button className="download-btn" onClick={downloadPDF}>
            📄 Download as PDF
          </button>

          <div className="topic-details" ref={contentRef}>
            {Array.isArray(details.text)
              ? details.text.map((t, i) => <p key={i}>{t}</p>)
              : <p>{details.text}</p>}

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
                      <b>Q:</b> {mcq.question}
                      <ul>
                        {(mcq.options || []).map((opt, idx) => (
                          <li key={idx}>{opt}</li>
                        ))}
                      </ul>
                      <i>Answer:</i> {mcq.answer}
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
