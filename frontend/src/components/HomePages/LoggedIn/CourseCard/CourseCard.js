import React from "react";
import "./CourseCard.css";
import { FaTrash } from "react-icons/fa";
import { useNavigate } from 'react-router-dom';

function CourseCard({ label, gradient, abbreviation, onDelete, onClick }) {
  const navigate = useNavigate();
  
  const handleCardClick = () => {
    console.log(`${label}"`);
    // const rawLabel = label.trim().replace(/^"|"$/g, '');
    // const courseSlug = rawLabel.toLowerCase().replace(/\s+/g, '-');
    // const baseUrl = window.location.origin;
    // const fullUrl = `${baseUrl}/course`;
    // window.open(fullUrl, "_blank");
    const rawLabel = label.trim().replace(/^"|"$/g, '');
    navigate('/course', {
      state: { label: rawLabel } // ✅ pass the label via state
    });
  };

  return (
    <div className="course-box" onClick={handleCardClick} style={{ cursor: "pointer" }}>
      <div className="course-top" style={{ background: gradient, color: "#fff", position: "relative" }}>
        <span>{abbreviation}</span>
        <button
          className="delete-button"
          onClick={(e) => {
            e.stopPropagation(); // prevent triggering card click
            onDelete();
          }}
        >
          <FaTrash />
        </button>
      </div>
      <div className="course-label">{label}</div>
    </div>
  );
}

export default CourseCard;
