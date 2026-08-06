import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, requiredRole }) {
  const {
    isAuthenticated,
    loading,
    user,
    sessionError,
    refreshUser,
  } = useAuth();

  if (loading) {
    return <div className="page-loading">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Keep the saved login when Render is waking up or the network briefly
  // fails. The user can retry instead of being incorrectly sent to Login.
  if (!user) {
    return (
      <main className="page-container">
        <div className="cc-form-card session-retry-card">
          <h1>Unable to verify your session</h1>
          <p>
            {sessionError ||
              "CampusCart could not load your account information right now."}
          </p>
          <button
            type="button"
            className="primary-button"
            onClick={() => refreshUser().catch(() => {})}
          >
            Try Again
          </button>
        </div>
      </main>
    );
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
