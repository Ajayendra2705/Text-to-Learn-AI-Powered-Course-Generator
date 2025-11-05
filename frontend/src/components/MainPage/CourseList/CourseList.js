import React from "react";
import CourseCard from "../CourseCard/CourseCard";
import getCourseGradient from "../getCourseGradient";
import "./CourseList.css";

function CourseList({ courses, onDelete }) {
  return (
    <div className="courses-wrapper">
      {courses.map((course, index) => {
        const isObject = typeof course === "object" && course !== null;
        const courseId = isObject ? course._id : null;
        const courseName = isObject
          ? course.title || course.courseName || ""
          : course;

        const abbreviation = courseName
          .split(" ")
          .map((w) => w.charAt(0).toUpperCase())
          .join("");

        return (
          <CourseCard
            key={courseId || index}
            courseId={courseId}
            label={courseName}
            abbreviation={abbreviation}
            gradient={getCourseGradient(index)}
            onDelete={(id) => id && onDelete(id)}
          />
        );
      })}
    </div>
  );
}

export default CourseList;
