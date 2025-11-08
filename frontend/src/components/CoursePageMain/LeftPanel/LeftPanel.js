import React, { useEffect, useState, useCallback } from "react";
import "./LeftPanel.css";

export default function LeftPanel({ courseTitle, onSelectSubmodule }) {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedModules, setExpandedModules] = useState({});
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  // 🧠 Fetch course outline (background queue by default)
  const fetchOutline = useCallback(async () => {
    if (!courseTitle) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${BACKEND_URL}/api/generate_outline`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseTitle }),
      });

      if (!res.ok) throw new Error(`Failed to fetch outline (${res.status})`);
      const data = await res.json();
      setModules(data.modules || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [courseTitle, BACKEND_URL]);

  useEffect(() => {
    fetchOutline();
  }, [fetchOutline]); // ✅ ESLint safe

  // ⚡ Promote outline generation to priority queue
  const promoteOutlinePriority = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/generate_outline/priority`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseTitle }),
      });

      if (!res.ok) throw new Error("Failed to promote outline priority");
      console.log(`⚡ [Priority] Outline promoted for "${courseTitle}"`);
    } catch (err) {
      console.error("❌ [Priority] Outline promotion failed:", err.message);
    }
  };

  const toggleModule = (index) => {
    setExpandedModules((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));

    // 👇 Promote outline job silently on user expand
    promoteOutlinePriority();
  };

  // ⚡ Trigger topic generation on click
  const handleSubmoduleClick = async (e, moduleTitle, submoduleName) => {
    e.stopPropagation();
    onSelectSubmodule({ moduleTitle, submoduleName });

    try {
      const res = await fetch(`${BACKEND_URL}/api/topic_details/priority`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: submoduleName,
          moduleName: moduleTitle,
          courseTitle,
        }),
      });

      if (!res.ok) throw new Error("Failed to trigger priority topic generation");
      console.log(`⚡ [Priority] Triggered topic generation for "${submoduleName}"`);
    } catch (err) {
      console.error("❌ [Priority] Error triggering topic:", err.message);
    }
  };

  return (
    <nav id="left-panel" aria-label={`${courseTitle}`}>
      <h2 tabIndex={0}>Modules for: {courseTitle}</h2>

      {loading && <p className="info-text">Loading modules...</p>}
      {error && <p className="error-text">Error: {error}</p>}
      {!loading && !error && modules.length === 0 && (
        <p className="info-text">No modules found.</p>
      )}

      <ul className="modules-list">
        {modules.map((mod, idx) => (
          <li key={idx}>
            <strong
              role="button"
              tabIndex={0}
              onClick={() => toggleModule(idx)}
              onKeyDown={(e) =>
                (e.key === "Enter" || e.key === " ") && toggleModule(idx)
              }
              aria-expanded={!!expandedModules[idx]}
              className={`module-title ${expandedModules[idx] ? "active" : ""}`}
            >
              {mod.title}
            </strong>

            <ul
              className={`submodules-list ${
                expandedModules[idx] ? "expanded" : ""
              }`}
            >
              {mod.submodules.map((sub, i) => (
                <li
                  key={i}
                  role="button"
                  tabIndex={0}
                  onClick={(e) => handleSubmoduleClick(e, mod.title, sub)}
                  onKeyDown={(e) =>
                    (e.key === "Enter" || e.key === " ") &&
                    handleSubmoduleClick(e, mod.title, sub)
                  }
                  className="clickable-submodule"
                >
                  {sub}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </nav>
  );
}
