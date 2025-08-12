import React from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../../../firebaseConfig";
import { signOut } from "firebase/auth";
import "./Navbar.css";

function Navbar({ user }) {
  const navigate = useNavigate();
  const fullName = user?.displayName || "User";
  const firstName = fullName.split(" ")[0];

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("user");
      localStorage.removeItem("token");

      if (window.google && window.google.accounts) {
        window.google.accounts.id.disableAutoSelect();
      }

      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <div className="navbar">
      <h1>AI Course Generator</h1>
      <div className="navbar-buttons">
        <button className="get-started-btn">Welcome, {firstName}</button>
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
}

export default Navbar;
