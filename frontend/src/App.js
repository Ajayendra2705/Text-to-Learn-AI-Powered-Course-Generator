import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./components/LoginPage/LoginPage";
import HomePage from "./components/MainPage/HomePage/HomePage";
import CoursePage from "./components/CoursePageMain/CoursePage/CoursePage";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/course" element={<CoursePage />} />
      </Routes>
    </Router>
  );
}
