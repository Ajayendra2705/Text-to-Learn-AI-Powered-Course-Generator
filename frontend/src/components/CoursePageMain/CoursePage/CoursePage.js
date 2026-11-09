import React, { useState } from "react";
import { useLocation, Navigate } from "react-router-dom";
import LeftPanel from "../LeftPanel/LeftPanel";
import RightPanel from "../RightPanel/RightPanel";
import "./CoursePage.css";
import Footer from "../Footer/Footer";

export default function CoursePage() {
  const location = useLocation();
  const { label: courseTitle } = location.state || {};

  // selected item now contains { module, submodule }
  const [selectedItem, setSelectedItem] = useState(null);

  // Opened directly (e.g. typed URL / new tab) → no course in router state
  if (!courseTitle) return <Navigate to="/home" replace />;

  return (
    <div className="course-page-container" style={{ display: "flex", height: "100vh" }}>
      <LeftPanel courseTitle={courseTitle} onSelectSubmodule={setSelectedItem} />
      <RightPanel selectedItem={selectedItem} courseTitle={courseTitle} />
      <Footer />
    </div>
  );
}
