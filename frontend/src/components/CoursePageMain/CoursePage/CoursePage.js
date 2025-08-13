import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import LeftPanel from "../LeftPanel/LeftPanel";
import RightPanel from "../RightPanel/RightPanel";
import "./CoursePage.css"; // optional, for layout styling
import Footer from "../Footer/Footer";

export default function CoursePage() {
  const location = useLocation();
  const { label: courseTitle } = location.state || {};

  const [selectedSubmodule, setSelectedSubmodule] = useState(null);

  return (
    <div className="course-page-container" style={{ display: "flex", height: "100vh" }}>
      <LeftPanel courseTitle={courseTitle} onSelectSubmodule={setSelectedSubmodule} />
      <RightPanel selectedSubmodule={selectedSubmodule} />
      <Footer />
    </div>
  );
}
