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
      id="left-panel"
      style={{ width: `${panelWidth}%` }}
    >
      <h2 id="course-title">{courseData.title}</h2>
      <p id="course-description">{courseData.description}</p>

      {loading ? (
        <p id="loading-text">Loading modules...</p>
      ) : (
        courseData.modules.map((module, index) => (
          <div key={index} id="accordion-section">
            <div
              id={`module-box-${index}`}
              className={expandedModuleIndex === index ? "active" : ""}
              onClick={() => toggleModule(index)}
            >
              {module.name}
            </div>
            <div
              id={`topic-list-container-${index}`}
              className={expandedModuleIndex === index ? "expanded" : ""}
            >
              {module.topics.map((topic, i) => (
                <div
                  key={i}
                  id={`topic-box-${index}-${i}`}
                  className={selectedTopic?.title === topic.title ? "active" : ""}
                  onClick={() => handleTopicClick(index, i)}
                >
                  {topic.title}
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      <div
        id="drag-handle"
        onMouseDown={startDragging}
        role="separator"
        aria-orientation="vertical"
      ></div>
    </div>
  );
}

export default LeftPanel;
