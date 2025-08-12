import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import LeftPanel from "../LeftPanel/LeftPanel";
import RightPanel from "../RightPanel/RightPanel";
import "./CoursePage.css"; // optional, for layout styling

export default function CoursePage() {
  const location = useLocation();
  const { label: courseTitle, courseId } = location.state || {};

  const [selectedSubmodule, setSelectedSubmodule] = useState(null);

  return (
    <div className="course-page-container" style={{ display: "flex", height: "100vh" }}>
      <LeftPanel courseTitle={courseTitle} onSelectSubmodule={setSelectedSubmodule} />
      <RightPanel selectedSubmodule={selectedSubmodule} />
    </div>
  );
}
