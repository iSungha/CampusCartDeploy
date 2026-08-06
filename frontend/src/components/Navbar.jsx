import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { ShieldCheck, ShoppingCart, User } from "lucide-react";

import api from "../api/api";
import { useAuth } from "../context/AuthContext";

const UNREAD_REFRESH_EVENT = "campuscart:inquiries-read";

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === "admin";
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return undefined;
    }

    let active = true;

    async function loadUnreadCount() {
      try {
        const response = await api.get("/inquiries/unread-count");
        const nextCount = Number(response.data?.unreadCount);

        if (active) {
          setUnreadCount(Number.isFinite(nextCount) ? nextCount : 0);
        }
      } catch (error) {
        // Do not interrupt navigation for a notification-count failure. The
        // next poll, focus event, or thread-open event will try again.
        if (active && error.response?.status === 401) {
          setUnreadCount(0);
        }
        console.error("Unread inquiry count error:", error);
      }
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        loadUnreadCount();
      }
    }

    loadUnreadCount();

    const intervalId = window.setInterval(loadUnreadCount, 30000);
    window.addEventListener("focus", loadUnreadCount);
    window.addEventListener(UNREAD_REFRESH_EVENT, loadUnreadCount);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      active = false;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", loadUnreadCount);
      window.removeEventListener(UNREAD_REFRESH_EVENT, loadUnreadCount);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isAuthenticated]);

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
        <NavLink
          to="/inquiries"
          className={({ isActive }) =>
            `inquiries-nav-link${isActive ? " active" : ""}`
          }
        >
          <span>Inquiries</span>
          {isAuthenticated && unreadCount > 0 && (
            <span
              className="inquiries-nav-badge"
              aria-label={`${unreadCount} unread message${
                unreadCount === 1 ? "" : "s"
              }`}
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </NavLink>
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
