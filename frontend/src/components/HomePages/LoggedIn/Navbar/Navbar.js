import './Navbar.css';
import { useLocation } from 'react-router-dom';

function Navbar() {
  const location = useLocation();
  const user = location.state?.user;
  const fullName = user?.name || "User";
  const firstName = fullName.split(' ')[0]; // Get only the first name

  return (
    <div className="navbar">
      <h1>AI Course Generator</h1>
      <button className="get-started-btn">Welcome, {firstName}</button>
    </div>
  );
}

export default Navbar;
