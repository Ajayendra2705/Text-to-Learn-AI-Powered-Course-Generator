import React, { useEffect, useState } from "react";
import './LeftPanel.css';

export default function LeftPanel({ courseTitle, onSelectSubmodule }) {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedModules, setExpandedModules] = useState({}); // Track expanded modules

useEffect(() => {
  if (!courseTitle) return;

  const cached = localStorage.getItem(`modules_${courseTitle}`);
  if (cached) {
    setModules(JSON.parse(cached));
    return;
  }

  const fetchAndSaveOutline = async () => {
    setLoading(true);
    setError(null);
    const BACKEND_URL = "https://text-to-learn-ai-powered-course.onrender.com";

    try {
      const response = await fetch(`${BACKEND_URL}/api/generate_outline`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseTitle }),
      });

      if (!response.ok) throw new Error("Failed to fetch modules");

      const data = await response.json();
      setModules(data.modules || []);
      localStorage.setItem(`modules_${courseTitle}`, JSON.stringify(data.modules || []));

      // Optional backend save (can remove if unnecessary)
      await fetch(`${BACKEND_URL}/api/saved_courses/save_outline`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseName: courseTitle, topics: data.modules }),
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  fetchAndSaveOutline();
}, [courseTitle]);


  // Toggle expanded/collapsed state for a module index
  const toggleModule = (index) => {
    setExpandedModules((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  // Handle submodule click without bubbling to module toggle
  const handleSubmoduleClick = (e, submodule) => {
    e.stopPropagation();
    onSelectSubmodule(submodule);
  };

  return (
    <nav id="left-panel" aria-label={`Modules for course ${courseTitle}`}>
      <h2 tabIndex={0}>Modules for: {courseTitle}</h2>

      {loading && <p className="info-text">Loading modules...</p>}
      {error && <p className="error-text">Error: {error}</p>}
      {!loading && !error && modules.length === 0 && <p className="info-text">No modules found.</p>}

      <ul className="modules-list">
        {modules.map((mod, idx) => (
          <li key={idx}>
            <strong
              role="button"
              tabIndex={0}
              onClick={() => toggleModule(idx)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") toggleModule(idx); }}
              aria-expanded={!!expandedModules[idx]}
              className={`module-title ${expandedModules[idx] ? "active" : ""}`}
            >
              {mod.title}
            </strong>

            <ul className={`submodules-list ${expandedModules[idx] ? "expanded" : ""}`}>
              {mod.submodules.map((sub, i) => (
                <li
                  key={i}
                  role="button"
                  tabIndex={0}
                  onClick={(e) => handleSubmoduleClick(e, sub)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleSubmoduleClick(e, sub); }}
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
