import React from "react";
import "./CourseCard.css";
import { FaTrash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

function CourseCard({ courseId, label, gradient, abbreviation, onDelete }) {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate("/course", {
      state: { courseId, label } // ✅ Pass both ID & name
    });
  };

  return (
    <div
      className="course-box"
      onClick={handleCardClick}
      style={{ cursor: "pointer" }}
    >
      <div
        className="course-top"
        style={{
          background: gradient,
          color: "#fff",
          position: "relative"
        }}
      >
        <span>{abbreviation}</span>
        <button
          className="delete-button"
          onClick={(e) => {
            e.stopPropagation();
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
