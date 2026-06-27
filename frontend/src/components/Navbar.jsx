import { Link, NavLink, useNavigate } from "react-router-dom";
import { ShoppingCart, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <header className="navbar">
      <Link to="/" className="navbar-logo">
        <ShoppingCart size={22} />
        <span>CampusCart</span>
      </Link>

      <nav className="navbar-links">
        <NavLink to="/listings">Browse</NavLink>
        <NavLink to="/sell">Sell</NavLink>
        <NavLink to="/saved">Saved</NavLink>
        <NavLink to="/dashboard">Dashboard</NavLink>
      </nav>

      <div className="navbar-actions">
        {isAuthenticated ? (
          <>
            <button className="profile-button" type="button">
              <User size={16} />
              Profile
            </button>
            <button className="secondary-button small" onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="secondary-button small">
              Login
            </Link>
            <Link to="/register" className="primary-button small">
              Sign Up
            </Link>
          </>
        )}
      </div>
    </header>
  );
}