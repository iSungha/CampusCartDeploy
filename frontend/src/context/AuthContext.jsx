import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/api";

const AuthContext = createContext(null);

const TOKEN_STORAGE_KEY = "campuscart_token";
const USER_STORAGE_KEY = "campuscart_user";

function readStoredUser() {
  try {
    const storedUser = localStorage.getItem(USER_STORAGE_KEY);
    return storedUser ? JSON.parse(storedUser) : null;
  } catch (error) {
    console.error("Failed to read the stored CampusCart user:", error);
    localStorage.removeItem(USER_STORAGE_KEY);
    return null;
  }
}

export function AuthProvider({ children }) {
  const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY) || null;
  const [user, setUser] = useState(readStoredUser);
  const [token, setToken] = useState(storedToken);
  const [loading, setLoading] = useState(Boolean(storedToken));
  const [sessionError, setSessionError] = useState("");

  const isAuthenticated = Boolean(token);

  function storeUser(nextUser) {
    setUser(nextUser || null);

    if (nextUser) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(nextUser));
    } else {
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  }

  function clearSession() {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    setToken(null);
    setUser(null);
    setSessionError("");
  }

  function saveSession(responseData) {
    const returnedToken = responseData?.token;
    const returnedUser = responseData?.user;

    if (!returnedToken) {
      throw new Error("Authentication succeeded, but no token was returned.");
    }

    localStorage.setItem(TOKEN_STORAGE_KEY, returnedToken);
    setToken(returnedToken);
    storeUser(returnedUser || null);
    setSessionError("");
  }

  useEffect(() => {
    let cancelled = false;

    async function loadUser() {
      if (!token) {
        if (!cancelled) {
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        const response = await api.get("/auth/me");

        if (!cancelled) {
          storeUser(response.data.user || response.data);
          setSessionError("");
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        const status = error.response?.status;

        // Only delete the saved login when the API confirms that the token is
        // invalid or forbidden. A Render cold start, temporary network error,
        // CORS issue, or 5xx response must not log the user out on refresh.
        if (status === 401 || status === 403) {
          clearSession();
        } else {
          console.error("Unable to refresh the CampusCart session:", error);
          setSessionError(
            "CampusCart could not verify your session right now. Your login has been kept."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadUser();

    return () => {
      cancelled = true;
    };
  }, [token]);

  async function refreshUser() {
    if (!token) {
      return null;
    }

    try {
      setLoading(true);
      const response = await api.get("/auth/me");
      const refreshedUser = response.data.user || response.data;
      storeUser(refreshedUser);
      setSessionError("");
      return refreshedUser;
    } catch (error) {
      const status = error.response?.status;

      if (status === 401 || status === 403) {
        clearSession();
      } else {
        setSessionError(
          "CampusCart could not verify your session right now. Your login has been kept."
        );
      }

      throw error;
    } finally {
      setLoading(false);
    }
  }

  function updateUser(partialUser) {
    setUser((previous) => {
      const nextUser = previous
        ? { ...previous, ...partialUser }
        : partialUser;

      if (nextUser) {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(nextUser));
      }

      return nextUser;
    });
  }

  async function register(formData) {
    const response = await api.post("/auth/register", formData);
    const registrationData = response.data;

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
      // Local development intentionally requires email verification. Render
      // auto-verifies the account, so registration logs the user in there.
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
      clearSession();
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        sessionError,
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
