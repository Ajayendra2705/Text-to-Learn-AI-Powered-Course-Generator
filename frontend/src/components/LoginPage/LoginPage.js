import React, { useState, useEffect } from "react";
import "./LoginPage.css";
import { auth, googleProvider } from "../../firebaseConfig";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  onAuthStateChanged,
} from "firebase/auth";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(true); // for auth state loading
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        // User already logged in, go to home directly
        navigate("/home");
      } else {
        setLoading(false); // No user logged in, stop loading and show login form
      }
    });
    return () => unsub();
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    const email = e.target.email.value.trim();
    const password = e.target.password.value;

    try {
      let userCredential;
      if (isSignup) {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
      } else {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      }
      const user = userCredential.user;

      // Save user info to your backend
      await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || "",
        }),
      });

      navigate("/home"); // Navigate on success
    } catch (err) {
      alert(err.message);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || "",
        }),
      });

      navigate("/home");
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>; // Or spinner
  }

  return (
    <div className="container">
      <div className="left-panel">
        <h1>Welcome Back!</h1>
        <p>Access your account and continue your journey with us.</p>
      </div>
      <div className="right-panel">
        <form onSubmit={handleLogin}>
          <h2>{isSignup ? "Sign Up" : "Login"}</h2>
          <input type="email" name="email" placeholder="Email" required />
          <input type="password" name="password" placeholder="Password" required />
          <button type="submit">{isSignup ? "Sign Up" : "Sign In"}</button>
          <p className="or">or login with</p>
          <button type="button" className="google-login" onClick={handleGoogleLogin}>
            Login with Google
          </button>
          <p style={{ marginTop: "1rem", textAlign: "center" }}>
            {isSignup ? "Already have an account?" : "Don't have an account?"}
            <button
              type="button"
              onClick={() => setIsSignup(!isSignup)}
              style={{ background: "none", border: "none", color: "#4364f7", cursor: "pointer" }}
            >
              {isSignup ? "Login" : "Sign Up"}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
