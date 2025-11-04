import React, { useEffect, useState } from "react";
import Navbar from "../Navbar/Navbar";
import { auth } from "../../../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import CourseInput from "../CourseInput/CourseInput";
import CourseList from "../CourseList/CourseList";
import { useNavigate } from "react-router-dom";
import Footer from "../Footer/Footer";
import "./HomePage.css";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

function HomePage() {
  const [user, setUser] = useState(null);
  const [courses, setCourses] = useState([]);
  const [inputText, setInputText] = useState("");
  const navigate = useNavigate();

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
    });
    return () => unsubscribe();
  }, []);

  // Fetch user's courses once logged in
  useEffect(() => {
    if (user?.uid) {
      fetch(`${BACKEND_URL}/api/courses/${user.uid}`)
        .then((res) => res.json())
        .then((data) => setCourses(data))
        .catch((err) => console.error("Error fetching courses:", err));
    }
  }, [user]);

  const handleAddCourse = async (suggestion) => {
    if (suggestion && suggestion.trim() !== "") {
      const trimmedCourse = suggestion.trim();

      try {
        const res = await fetch(`${BACKEND_URL}/api/courses`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: trimmedCourse,
            userId: user?.uid || null,
          }),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Failed to add course");
        }

        const newCourse = await res.json();
        setCourses((prev) => [...prev, newCourse]); // Append new course
        setInputText("");
      } catch (error) {
        console.error("Error saving course to DB:", error);
      }
    }
  };

  const handleDeleteCourse = async (courseId) => {
    try {
      await fetch(`${BACKEND_URL}/api/courses/${courseId}`, {
        method: "DELETE",
      });
      setCourses((prev) => prev.filter((course) => course._id !== courseId));
    } catch (error) {
      console.error("Error deleting course:", error);
    }
  };

  const handleCourseClick = (course) => {
    navigate("/course", {
      state: { label: course.title, courseId: course._id },
    });
  };

  if (!user) {
    return <p className="loading-text">Loading user info...</p>;
  }

  return (
    <div className="home-page-container">
      <Navbar user={user} />
      <h1 className="welcome-heading">
        Hello, {user.displayName ? user.displayName.split(" ")[0] : "User"}!
      </h1>
      <div className="loggedin-container">
        <CourseInput
          inputText={inputText}
          setInputText={setInputText}
          onAdd={handleAddCourse}
        />
        <CourseList
          courses={courses}
          onDelete={(index) => handleDeleteCourse(courses[index]._id)}
          onClick={(index) => handleCourseClick(courses[index])}
        />
      </div>
      <Footer />
    </div>
  );
}

export default HomePage;
