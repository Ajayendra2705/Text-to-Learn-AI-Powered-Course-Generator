import React from "react";
import CourseCard from "../CourseCard/CourseCard";
import getCourseGradient from "../getCourseGradient";
import './CourseList.css';

function CourseList({ courses, onDelete }) {
  const handleCardClick = () => {
    console.log("hello world");
  };

  return (
    <div className="courses-wrapper">
      {courses.map((course, index) => (
        <CourseCard
          key={index}
          label={course}
          abbreviation={course.split(" ").map(w => w.charAt(0).toUpperCase()).join("")}
          gradient={getCourseGradient(index)}
          onDelete={() => onDelete(index)}
          onClick={handleCardClick}
        />
      ))}
    </div>
  );
}

export default CourseList;
