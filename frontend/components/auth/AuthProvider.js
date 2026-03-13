"use client";

import { createContext, useContext, useEffect, useState } from "react";

import { apiGet, apiPost, clearAccessToken, getAccessToken, setAccessToken } from "@/lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  async function refreshCurrentUser() {
    const storedToken = getAccessToken();
    if (!storedToken) {
      setToken(null);
      setUser(null);
      return null;
    }

    setToken(storedToken);
    try {
      const me = await apiGet("/auth/me");
      setUser(me);
      return me;
    } catch (err) {
      if (err.status === 401) {
        clearAccessToken();
        setToken(null);
        setUser(null);
        return null;
      }
      throw err;
    }
  }

  async function login({ email, password }) {
    const tokenResponse = await apiPost("/auth/login", { email, password });
    setAccessToken(tokenResponse.access_token);
    setToken(tokenResponse.access_token);
    const me = await apiGet("/auth/me");
    setUser(me);
    return me;
  }

  function logout() {
    clearAccessToken();
    setToken(null);
    setUser(null);
  }

  useEffect(() => {
    let cancelled = false;

    async function bootstrapAuth() {
      const storedToken = getAccessToken();
      setToken(storedToken);

      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const me = await apiGet("/auth/me");
        if (!cancelled) {
          setUser(me);
        }
      } catch (err) {
        if (!cancelled && err.status === 401) {
          clearAccessToken();
          setToken(null);
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    bootstrapAuth();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        loading,
        login,
        logout,
        refreshCurrentUser,
        token,
        user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
