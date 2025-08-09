import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "./Navbar/Navbar";
import CourseInput from "./CourseInput/CourseInput";
import CourseList from "./CourseList/CourseList";
import Footer from "../../Footer/Footer";
import './LoggedIn.css';

function LoggedIn() {
  const location = useLocation();
  const navigate = useNavigate();

  const direction = location.state?.direction || "default";
  const [user, setUser] = useState(location.state?.user || JSON.parse(localStorage.getItem("user")));

  useEffect(() => {
    if (!user) {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  const variants = {
    default: {
      initial: { x: 0 },
      animate: { x: 0 },
      exit: { x: 0 }
    },
    "right-swipe": {
      initial: { x: "100%" },
      animate: { x: 0 },
      exit: { x: "100%" }
    }
  };

  const transition = { duration: 1.5, ease: "easeInOut" };
  const current = variants[direction];

  const [courses, setCourses] = useState([]);
  const [inputText, setInputText] = useState("");

const handleAddCourse = (suggestion) => {
  if (suggestion && suggestion.trim() !== "") {
    setCourses(prev => [...prev, suggestion.trim()]);
  }
};


  // ✅ Add this function to delete course by index
  const handleDeleteCourse = (indexToDelete) => {
    setCourses(prev => prev.filter((_, i) => i !== indexToDelete));
  };

  return (
    <motion.div
      className="page-container"
      initial={current.initial}
      animate={current.animate}
      exit={current.exit}
      transition={transition}
      style={{ position: "absolute", width: "100%" }}
    >
      <Navbar user={user} />
      <div className="loggedin-container">
        <CourseInput
          inputText={inputText}
          setInputText={setInputText}
          onAdd={handleAddCourse}
        />
        {/* ✅ Pass onDelete */}
        <CourseList courses={courses} onDelete={handleDeleteCourse} />
      </div>
      <Footer />
    </motion.div>
  );
}

export default LoggedIn;
