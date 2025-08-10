import './Navbar.css';
import { useLocation, useNavigate } from 'react-router-dom';

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = location.state?.user;
  const fullName = user?.name || "User";
  const firstName = fullName.split(' ')[0];

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');

    if (window.google && window.google.accounts) {
      window.google.accounts.id.disableAutoSelect();
    }

    navigate('/');
  };

  return (
    <div className="navbar">
      <h1>AI Course Generator</h1>
      <div className="navbar-buttons">
        <button className="get-started-btn">Welcome, {firstName}</button>
        <button className="logout-btn" onClick={handleLogout}>Logout</button>
      </div>
    </div>
  );
}

export default Navbar;
