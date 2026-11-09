import React, { useEffect, useState } from "react";
import { apiFetch } from "../../../api";
import "./LeftPanel.css";

export default function LeftPanel({ courseTitle, onSelectSubmodule }) {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState(null);
  const [expandedModules, setExpandedModules] = useState({});

  useEffect(() => {
    if (!courseTitle) return;

    setModules([]);
    setError(null);
    setStatus("loading");
    setLoading(true);

    let pollInterval;
    let pollTimeout;
    let cancelled = false; // set on unmount / course change so late async work doesn't start polling

    const fetchOutline = async () => {
      try {
        console.log(`🎓 Checking outline for "${courseTitle}"...`);

        // Step 1️⃣ — Check if outline already exists
        const checkRes = await apiFetch(
          `/api/generate_outline/check/${encodeURIComponent(courseTitle)}`
        );

        if (cancelled) return;
        if (checkRes.ok) {
          const checkData = await checkRes.json();
          console.log("🧾 [Check] Response:", checkData);

          if (
            checkData.status === "completed" &&
            Array.isArray(checkData.modules) &&
            checkData.modules.length > 0
          ) {
            setModules([...checkData.modules]);
            setStatus("completed");
            setLoading(false);
            return;
          }
        }

        // Step 2️⃣ — Queue PRIORITY outline generation
        console.log("⚡ Requesting PRIORITY outline generation...");
        const priorityRes = await apiFetch(`/api/generate_outline/priority`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ courseTitle }),
        });

        if (!priorityRes.ok)
          throw new Error(`Failed to queue PRIORITY outline (${priorityRes.status})`);

        const priorityData = await priorityRes.json();
        if (cancelled) return;
        console.log("🚀 [Queued Priority] Outline generation started:", priorityData);
        setStatus("queued");

        // Step 3️⃣ — Start polling (to detect when DB is ready)
        pollTimeout = setTimeout(() => {
          pollInterval = setInterval(async () => {
            try {
              const pollRes = await apiFetch(
                `/api/generate_outline/check/${encodeURIComponent(courseTitle)}`
              );
              if (cancelled || !pollRes.ok) return;

              const pollData = await pollRes.json();
              console.log("🔄 [Polling] Status:", pollData.status);

              if (
                pollData.status === "completed" &&
                Array.isArray(pollData.modules) &&
                pollData.modules.length > 0
              ) {
                console.log("✅ Outline ready:", pollData.modules);
                setModules([...pollData.modules]);
                setStatus("completed");
                setLoading(false);
                clearInterval(pollInterval);
              } else if (pollData.status === "failed") {
                setError("Priority outline generation failed.");
                setLoading(false);
                clearInterval(pollInterval);
              } else {
                setStatus("generating");
              }
            } catch (err) {
              console.error("⚠️ Polling error:", err.message);
            }
          }, 5000);
        }, 2000);
      } catch (err) {
        if (cancelled) return;
        console.error("❌ Fetch failed:", err.message);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchOutline();

    // Cleanup polling on unmount or course change
    return () => {
      cancelled = true;
      clearTimeout(pollTimeout);
      clearInterval(pollInterval);
    };
  }, [courseTitle]);

  // 🧱 Toggle module expand/collapse
  const toggleModule = (index) => {
    setExpandedModules((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  // 🎯 Submodule click handler
  const handleSubmoduleClick = (e, moduleTitle, submoduleName) => {
    e.stopPropagation();
    console.log(`🎯 Selected submodule: ${submoduleName}`);
    onSelectSubmodule({ moduleTitle, submoduleName });
  };

  return (
    <nav id="left-panel">
      <h2>Modules for: {courseTitle}</h2>

      {loading && (
        <p className="info-text">
          {status === "loading"
            ? "Checking for outline..."
            : status === "queued"
            ? "Outline queued..."
            : "Generating outline..."}
        </p>
      )}
      {error && <p className="error-text">Error: {error}</p>}
      {!loading && modules.length === 0 && !error && (
        <p className="info-text">No modules yet. Please wait.</p>
      )}

      <ul className="modules-list">
        {modules.map((mod, idx) => (
          <li key={mod._id || idx}>
            <strong
              onClick={() => toggleModule(idx)}
              className={`module-title ${expandedModules[idx] ? "active" : ""}`}
            >
              {mod.title || `Module ${idx + 1}`}
            </strong>

            {expandedModules[idx] && mod.submodules && (
              <ul className="submodules-list">
                {mod.submodules.map((sub, i) => (
                  <li
                    key={`${idx}-${i}`}
                    className="clickable-submodule"
                    onClick={(e) => handleSubmoduleClick(e, mod.title, sub)}
                  >
                    {sub}
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
