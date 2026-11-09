import React, { useEffect, useState } from "react";
import { apiFetch } from "../../../api";
import Navbar from "../Navbar/Navbar";
import { auth } from "../../../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import CourseInput from "../CourseInput/CourseInput";
import CourseList from "../CourseList/CourseList";
import { useNavigate } from "react-router-dom";
import Footer from "../Footer/Footer";
import "./HomePage.css";


function HomePage() {
  const [user, setUser] = useState(null);
  const [courses, setCourses] = useState([]);
  const [inputText, setInputText] = useState("");
  const [loadingCourses, setLoadingCourses] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      // Not logged in → back to login page (otherwise stuck on "Loading user info..." forever)
      if (!firebaseUser) navigate("/");
      setUser(firebaseUser);
    });
    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (!user?.uid) return;

    const fetchCourses = async () => {
      setLoadingCourses(true);
      try {
        const res = await apiFetch(`/api/courses/${user.uid}`);
        const data = await res.json();
        // On error the backend returns { error }, which would crash courses.map()
        if (!res.ok || !Array.isArray(data)) throw new Error(data?.error || "Bad response");
        setCourses(data);
      } 
      catch (err) {
        console.error("❌ Error fetching courses:", err);
      } 
      finally {
        setLoadingCourses(false);
      }
    };

    fetchCourses();
  }, [user?.uid]);

  const handleAddCourse = async (payload) => {
    const titleRaw =
      typeof payload === "string"
        ? payload
        : payload?.title || payload?.label || payload?.courseName || "";

    const trimmedCourse = titleRaw.trim();
    if (!trimmedCourse) return;

    try {
      const res = await apiFetch(`/api/courses`, {
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

      setCourses((prev) => [newCourse, ...prev]);

      setInputText("");
    } 
    catch (error) {
      console.error("❌ Error saving course to DB:", error);
    }
  };

  const handleDeleteCourse = async (courseId) => {
    try {
      const res = await apiFetch(`/api/courses/${courseId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(`Delete failed (${res.status})`); // don't hide a course that wasn't deleted
      setCourses((prev) => prev.filter((c) => c._id !== courseId));
    } catch (error) {
      console.error("❌ Error deleting course:", error);
    }
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

        {loadingCourses ? (
          <p className="loading-text">Loading courses...</p>
        ) : (
          <CourseList
            courses={courses}
            onDelete={handleDeleteCourse}
          />
        )}
      </div>

      <Footer />
    </div>
  );
}

export default HomePage;
