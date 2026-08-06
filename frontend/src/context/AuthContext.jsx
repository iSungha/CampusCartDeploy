import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const storedToken = localStorage.getItem("campuscart_token") || null;
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(storedToken);
  const [loading, setLoading] = useState(Boolean(storedToken));

  const isAuthenticated = Boolean(token);

  function saveSession(responseData) {
    const returnedToken = responseData?.token;

    if (!returnedToken) {
      throw new Error("Authentication succeeded, but no token was returned.");
    }

    localStorage.setItem("campuscart_token", returnedToken);
    setToken(returnedToken);
    setUser(responseData.user || null);
  }

  useEffect(() => {
    async function loadUser() {
      if (!token) {
        setLoading(false);
        return;
      }

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

  async function refreshUser() {
    try {
      const response = await api.get("/auth/me");
      setUser(response.data.user || response.data);
    } catch (error) {
      console.error("Failed to refresh user:", error);
    }
  }

  function updateUser(partialUser) {
    setUser((previous) =>
      previous ? { ...previous, ...partialUser } : partialUser
    );
  }

  async function register(formData) {
    const response = await api.post("/auth/register", formData);
    const registrationData = response.data;

    // Support a future backend version that returns a token directly from
    // registration. The current backend returns the created user, so the
    // frontend immediately calls login with the same credentials.
    if (registrationData?.token) {
      saveSession(registrationData);
      return { ...registrationData, autoLoggedIn: true };
    }

    try {
      const loginResponse = await api.post("/auth/login", {
        email: formData.email,
        password: formData.password,
      });

      saveSession(loginResponse.data);

      return {
        ...registrationData,
        autoLoggedIn: true,
        token: loginResponse.data.token,
        user: loginResponse.data.user || registrationData.user,
      };
    } catch (loginError) {
      // Local development intentionally requires email verification. In that
      // mode registration still succeeds, but automatic login must wait until
      // the email has been verified. Render auto-verifies and logs in here.
      if (registrationData?.user && !registrationData.user.isEmailVerified) {
        return {
          ...registrationData,
          autoLoggedIn: false,
          requiresVerification: true,
        };
      }

      throw loginError;
    }
  }

  async function login(formData) {
    const response = await api.post("/auth/login", formData);
    saveSession(response.data);
    return response.data;
  }

  async function logout() {
    try {
      if (token) {
        await api.post("/auth/logout");
      }
    } catch (error) {
      // Local cleanup must still happen when the API is unavailable or the
      // token has already expired.
      console.error("Server logout failed; clearing local session:", error);
    } finally {
      localStorage.removeItem("campuscart_token");
      setToken(null);
      setUser(null);
    }
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
        refreshUser,
        updateUser,
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
