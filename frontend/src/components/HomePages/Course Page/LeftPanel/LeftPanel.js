import React, { useRef, useEffect } from "react";
import "./LeftPanel.css";

function LeftPanel({
  courseData,
  loading,
  expandedModuleIndex,
  toggleModule,
  selectedTopic,
  handleTopicClick,
  panelWidth,
  setPanelWidth
}) {
  const isDragging = useRef(false);

  const startDragging = (e) => {
    e.preventDefault();
    isDragging.current = true;
    document.body.style.cursor = "col-resize";
  };

  const stopDragging = () => {
    if (isDragging.current) {
      isDragging.current = false;
      document.body.style.cursor = "default";
    }
  };

  const handleMouseMove = (e) => {
    if (!isDragging.current) return;
    const newWidthPercent = (e.clientX / window.innerWidth) * 100;
    // Clamp between 20% and 70%
    if (newWidthPercent >= 0 && newWidthPercent <= 100) {
      setPanelWidth(newWidthPercent);
    }
  };

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", stopDragging);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", stopDragging);
    };
  }, []);

  return (
    <div
      className="left-panel"
      style={{ width: `${panelWidth}%` }}
    >
      <h2 className="course-title">{courseData.title}</h2>
      <p className="course-description">{courseData.description}</p>

      {loading ? (
        <p className="loading-text">Loading modules...</p>
      ) : (
        courseData.modules.map((module, index) => (
          <div key={index} className="accordion-section">
            <div
              className={`module-box ${
                expandedModuleIndex === index ? "active" : ""
              }`}
              onClick={() => toggleModule(index)}
            >
              {module.name}
            </div>
            <div
              className={`topic-list-container ${
                expandedModuleIndex === index ? "expanded" : ""
              }`}
            >
              {module.topics.map((topic, i) => (
                <div
                  key={i}
                  className={`topic-box ${
                    selectedTopic?.title === topic.title ? "active" : ""
                  }`}
                  onClick={() => handleTopicClick(index, i)}
                >
                  {topic.title}
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {/* Dragger */}
      <div
        className="drag-handle"
        onMouseDown={startDragging}
        role="separator"
        aria-orientation="vertical"
      ></div>
    </div>
  );
}

export default LeftPanel;
