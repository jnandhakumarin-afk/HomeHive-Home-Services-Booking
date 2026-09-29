import { useEffect, useState } from "react";

import { apiRequest } from "../services/api.js";
import { AuthContext } from "./auth.js";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => sessionStorage.getItem("homehive-token"));
  const [user, setUser] = useState(() => {
    if (!sessionStorage.getItem("homehive-token")) return null;

    try {
      return JSON.parse(sessionStorage.getItem("homehive-user") || "null");
    } catch {
      return null;
    }
  });
  const [isReady, setIsReady] = useState(() => !sessionStorage.getItem("homehive-token"));

  useEffect(() => {
    const handleUnauthorized = () => {
      sessionStorage.setItem("homehive-auth-message", "Your session expired. Please sign in again.");
      sessionStorage.removeItem("homehive-token");
      sessionStorage.removeItem("homehive-user");
      setToken(null);
      setUser(null);
      setIsReady(true);
    };

    window.addEventListener("homehive:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("homehive:unauthorized", handleUnauthorized);
  }, []);

  useEffect(() => {
    if (!token) return undefined;

    let active = true;

    apiRequest("/users/profile")
      .then(({ user: profile }) => {
        if (!active) return;
        setUser(profile);
        sessionStorage.setItem("homehive-user", JSON.stringify(profile));
      })
      .catch(() => {
        if (!active) return;
        sessionStorage.removeItem("homehive-token");
        sessionStorage.removeItem("homehive-user");
        setToken(null);
        setUser(null);
      })
      .finally(() => {
        if (active) setIsReady(true);
      });

    return () => {
      active = false;
    };
  }, [token]);

  const saveSession = (session) => {
    sessionStorage.setItem("homehive-token", session.token);
    sessionStorage.setItem("homehive-user", JSON.stringify(session.user));
    setToken(session.token);
    setUser(session.user);
    setIsReady(true);
  };

  const login = async (credentials) => {
    const session = await apiRequest("/auth/login", {
      method: "POST",
      body: credentials,
      authenticated: false
    });
    saveSession(session);
    return session.user;
  };

  const register = async (details) => {
    await apiRequest("/auth/register", {
      method: "POST",
      body: details,
      authenticated: false
    });
    return login({ email: details.email, password: details.password });
  };

  const updateProfile = async (details) => {
    const data = await apiRequest("/users/profile", {
      method: "PATCH",
      body: details
    });
    setUser(data.user);
    sessionStorage.setItem("homehive-user", JSON.stringify(data.user));
    return data.user;
  };

  const logout = () => {
    sessionStorage.removeItem("homehive-token");
    sessionStorage.removeItem("homehive-user");
    setToken(null);
    setUser(null);
    setIsReady(true);
  };

  return (
    <AuthContext.Provider value={{ user, isReady, login, register, updateProfile, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
