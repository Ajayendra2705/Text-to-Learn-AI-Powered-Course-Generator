import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import NotLoggedIn from "./components/HomePages/NotLoggedIn/NotLoggedIn";
import LoggedIn from "./components/HomePages/LoggedIn/LoggedIn";
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from "jwt-decode";
import CoursePage from "./components/HomePages/Course Page/CoursePage";
import './App.css';

function AnimatedRoutes({ user, setUser }) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogin = (credentialResponse) => {
    const decoded = jwtDecode(credentialResponse.credential);
    setUser(decoded);
    navigate("/home");
  };

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={
            <NotLoggedIn>
              <GoogleLogin onSuccess={handleLogin} onError={() => console.log("Login Failed")} />
            </NotLoggedIn>
          }
        />
        <Route path="/home" element={<LoggedIn user={user} />} />
        <Route path="/course" element={<CoursePage />} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  const [user, setUser] = useState(null);

  return (
    <Router>
      <AnimatedRoutes user={user} setUser={setUser} />
    </Router>
  );
}

export default App;
