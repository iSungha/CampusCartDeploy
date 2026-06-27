import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(
    localStorage.getItem("campuscart_token") || null
  );
  const [loading, setLoading] = useState(false);

  const isAuthenticated = Boolean(token);

  useEffect(() => {
    async function loadUser() {
      if (!token) return;

      try {
        setLoading(true);
        const response = await api.get("/auth/me");
        setUser(response.data.user || response.data);
      } catch (error) {
        console.error("Failed to load user:", error);
        localStorage.removeItem("campuscart_token");
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, [token]);

  async function register(formData) {
    const response = await api.post("/auth/register", formData);
    return response.data;
  }

  async function login(formData) {
    const response = await api.post("/auth/login", formData);

    const returnedToken = response.data.token;

    if (!returnedToken) {
      throw new Error("Login successful, but no token was returned.");
    }

    localStorage.setItem("campuscart_token", returnedToken);
    setToken(returnedToken);
    setUser(response.data.user || null);

    return response.data;
  }

  function logout() {
    localStorage.removeItem("campuscart_token");
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated,
        register,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider");
  }

  return context;
}