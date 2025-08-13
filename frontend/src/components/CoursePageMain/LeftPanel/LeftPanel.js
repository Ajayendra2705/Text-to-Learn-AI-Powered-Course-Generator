import React, { useEffect, useState } from "react";
import "./LeftPanel.css";

export default function LeftPanel({ courseTitle, onSelectSubmodule }) {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedModules, setExpandedModules] = useState({});

  useEffect(() => {
    if (!courseTitle) return;

    const BACKEND_URL = "https://text-to-learn-ai-powered-course.onrender.com";

    const fetchOutline = async () => {
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
    };

    fetchOutline();
  }, [courseTitle]);

  const toggleModule = (index) => {
    setExpandedModules((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handleSubmoduleClick = (e, submodule) => {
    e.stopPropagation();
    onSelectSubmodule(submodule);
  };

  return (
    <nav id="left-panel" aria-label={`Modules for course ${courseTitle}`}>
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
                  onClick={(e) => handleSubmoduleClick(e, sub)}
                  onKeyDown={(e) =>
                    (e.key === "Enter" || e.key === " ") &&
                    handleSubmoduleClick(e, sub)
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
