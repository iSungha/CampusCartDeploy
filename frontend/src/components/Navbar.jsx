import { Link, NavLink, useNavigate } from "react-router-dom";
import { ShieldCheck, ShoppingCart, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === "admin";

  async function handleLogout() {
    await logout();
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
        <NavLink to="/inquiries">Inquiries</NavLink>
        <NavLink to="/dashboard">Dashboard</NavLink>
        {isAdmin && (
          <NavLink to="/admin" className="admin-nav-link">
            <ShieldCheck size={16} />
            Admin Dashboard
          </NavLink>
        )}
      </nav>

      <div className="navbar-actions">
        {isAuthenticated ? (
          <>
            <Link className="profile-button" to="/profile">
              <User size={16} />
              Profile
            </Link>
            <button
              className="secondary-button small"
              type="button"
              onClick={handleLogout}
            >
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
