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
  const [loadingCourses, setLoadingCourses] = useState(false);
  const navigate = useNavigate();

  // ✅ Track Firebase authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
    });
    return () => unsubscribe();
  }, []);

  // ✅ Fetch user's saved courses
  useEffect(() => {
    if (!user?.uid) return;

    const fetchCourses = async () => {
      setLoadingCourses(true);
      try {
        const res = await fetch(`${BACKEND_URL}/api/courses/${user.uid}`);
        if (!res.ok) throw new Error(`Failed to fetch courses (${res.status})`);

        const data = await res.json();

        // ✅ Always ensure we store an array
        if (Array.isArray(data)) {
          setCourses(data);
        } else {
          console.warn("⚠️ Backend returned non-array response for courses:", data);
          setCourses([]);
        }
      } catch (err) {
        console.error("❌ Error fetching courses:", err.message);
        setCourses([]); // fallback to empty list
      } finally {
        setLoadingCourses(false);
      }
    };

    fetchCourses();
  }, [user?.uid]);

  // ✅ Add a new course
  const handleAddCourse = async (payload) => {
    const titleRaw =
      typeof payload === "string"
        ? payload
        : payload?.title || payload?.label || payload?.courseName || "";

    const trimmedCourse = titleRaw.trim();
    if (!trimmedCourse) return;

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
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to add course");
      }

      const newCourse = await res.json();
      if (newCourse && newCourse._id) {
        setCourses((prev) => [newCourse, ...prev]);
      }

      setInputText("");
    } catch (error) {
      console.error("❌ Error saving course to DB:", error.message);
    }
  };

  // ✅ Delete course and cancel any queued background tasks
  const handleDeleteCourse = async (courseId) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/courses/${courseId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete course");
      }

      // remove locally
      setCourses((prev) => prev.filter((c) => c._id !== courseId));

      // 🧹 Tell backend to clean up queue
      await fetch(`${BACKEND_URL}/api/queue/cleanup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
      });

      console.log(`🧹 [Cleanup] Queue cleanup triggered for course ${courseId}`);
    } catch (error) {
      console.error("❌ Error deleting course:", error.message);
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

        {loadingCourses ? (
          <p className="loading-text">Loading courses...</p>
        ) : (
          <CourseList
            courses={Array.isArray(courses) ? courses : []}
            onDelete={handleDeleteCourse}
            onClick={handleCourseClick}
          />
        )}
      </div>

      <Footer />
    </div>
  );
}

export default HomePage;
