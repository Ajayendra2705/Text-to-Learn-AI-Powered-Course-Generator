import './Navbar.css';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { useState, useEffect } from 'react';

function Navbar() {
  const navigate = useNavigate();
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      navigate("/home", {
        state: {
          user: JSON.parse(storedUser),
          direction: "right-swipe"
        }
      });
    }
    else {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  const handleSuccess = (credentialResponse) => {
    try {
      const decoded = jwtDecode(credentialResponse.credential);
      console.log("User data:", decoded);
      localStorage.setItem("user", JSON.stringify(decoded));
      navigate("/home", {
        state: {
          user: decoded,
          direction: "right-swipe"
        }
      });
    } catch (err) {
      console.error("JWT Decode Error:", err);
    }
  };

  const handleGetStarted = () => {
    setShowLogin(true);
  };

  return (
    <div className="navbar">
      <h1>AI Course Generator</h1>

      {showLogin ? (
        <GoogleLogin
          onSuccess={handleSuccess}
          onError={() => console.log("Login Failed")}
        />
      ) : (
        <button className="get-started-btn" onClick={handleGetStarted}>
          Get Started
        </button>
      )}
    </div>
  );
}

export default Navbar;
