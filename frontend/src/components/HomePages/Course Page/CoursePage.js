import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import RightPanel from "./RightPanel.js/RightPanel";
import LeftPanel from "./LeftPanel/LeftPanel";
import './CoursePage.css';

function CoursePage() {
  const location = useLocation();
  const label = location.state?.label || "AI";

  const [expandedModuleIndex, setExpandedModuleIndex] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [courseData, setCourseData] = useState({ title: label, description: "", modules: [] });
  const [loading, setLoading] = useState(true);
  const [topicLoading, setTopicLoading] = useState(false);
  const [panelWidth, setPanelWidth] = useState(40); 

  useEffect(() => {
    async function fetchCourseOutline() {
      setLoading(true);
      try {
        const response = await fetch("http://localhost:5000/generate_course", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userInput: label })
        });
        const data = await response.json();

        const modulesWithTopics = data.modules.map((mod) => ({
          name: mod.module,
          topics: mod.submodules.map((sub) => ({
            title: typeof sub === "string" ? sub : sub.title || "Untitled",
            loaded: false,
            details: null
          }))
        }));

        setCourseData({
          title: label,
          description: `A dynamically generated course on ${label}.`,
          modules: modulesWithTopics
        });
      } catch (err) {
        console.error("❌ Failed to load outline:", err);
      }
      setLoading(false);
    }
    fetchCourseOutline();
  }, [label]);

  const toggleModule = (index) => {
    setExpandedModuleIndex((prev) => (prev === index ? null : index));
    setSelectedTopic(null);
  };

  const handleTopicClick = async (moduleIndex, topicIndex) => {
    const topic = courseData.modules[moduleIndex].topics[topicIndex];
    if (topic.loaded) {
      setSelectedTopic(topic.details);
      return;
    }

    setTopicLoading(true);
    try {
      const response = await fetch("http://localhost:5000/generate_topic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic.title })
      });
      const details = await response.json();

      const updatedModules = [...courseData.modules];
      updatedModules[moduleIndex].topics[topicIndex] = {
        ...topic,
        loaded: true,
        details: { title: topic.title, ...details }
      };
      setCourseData({ ...courseData, modules: updatedModules });
      setSelectedTopic({ title: topic.title, ...details });
    } catch (err) {
      console.error("❌ Failed to load topic:", err);
    }
    setTopicLoading(false);
  };

  return (
    <div className="course-layout">
      <LeftPanel
        courseData={courseData}
        loading={loading}
        expandedModuleIndex={expandedModuleIndex}
        toggleModule={toggleModule}
        selectedTopic={selectedTopic}
        handleTopicClick={handleTopicClick}
        panelWidth={panelWidth}
        setPanelWidth={setPanelWidth}
      />
      <RightPanel topicLoading={topicLoading} selectedTopic={selectedTopic} />
    </div>
  );
}

export default CoursePage;
