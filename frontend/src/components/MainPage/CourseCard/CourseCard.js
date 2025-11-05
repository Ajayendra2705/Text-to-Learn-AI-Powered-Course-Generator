import React from "react";
import "./CourseCard.css";
import { FaTrash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

function CourseCard({ courseId, label, gradient, abbreviation, onDelete }) {
  const navigate = useNavigate();

  const handleCardClick = () => {
    if (courseId)
      navigate("/course", {
        state: { courseId, label },
      });
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (!courseId) return;
    if (window.confirm(`Delete course "${label}"?`)) {
      onDelete(courseId);
    }
  };

  return (
    <div
      className="course-box"
      onClick={handleCardClick}
      tabIndex={0}
      role="button"
      onKeyDown={(e) => (e.key === "Enter" ? handleCardClick() : null)}
    >
      <div
        className="course-top"
        style={{
          background: gradient,
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0.6rem 0.8rem",
          borderRadius: "12px 12px 0 0",
        }}
      >
        <span className="course-abbreviation">{abbreviation}</span>
        <button
          className="delete-button"
          onClick={handleDelete}
          title="Delete this course"
        >
          <FaTrash />
        </button>
      </div>

      <div className="course-label">{label}</div>
    </div>
  );
}

export default CourseCard;
