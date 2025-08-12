import React from "react";
import CourseCard from "../CourseCard/CourseCard";
import getCourseGradient from "../getCourseGradient";
import "./CourseList.css";

function CourseList({ courses, onDelete }) {
  return (
    <div className="courses-wrapper">
      {courses.map((course, index) => {
        const courseName =
          typeof course === "string"
            ? course
            : course.title || course.courseName || "";

        const abbreviation = courseName
          .split(" ")
          .map((w) => w.charAt(0).toUpperCase())
          .join("");

        return (
          <CourseCard
            key={course._id || index}
            courseId={course._id} // ✅ Send ID
            label={courseName}
            abbreviation={abbreviation}
            gradient={getCourseGradient ? getCourseGradient(index) : "#6a11cb"}
            onDelete={() => onDelete(index)}
          />
        );
      })}
    </div>
  );
}

export default CourseList;
