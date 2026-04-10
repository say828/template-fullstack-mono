import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

import { getMe, login } from "../lib/api";
import type { User, UserRole } from "../lib/types";

interface AuthContextValue {
  token: string | null;
  user: User | null;
  loginWithPassword: (payload: { email: string; password: string; role: UserRole; rememberMe?: boolean }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = "template_access_token";
const SESSION_TOKEN_KEY = "template_session_access_token";

function loadStoredToken() {
  return localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(SESSION_TOKEN_KEY);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => loadStoredToken());
  const [user, setUser] = useState<User | null>(null);

  const refreshUser = async () => {
    if (!token) {
      setUser(null);
      return;
    }
    try {
      const me = await getMe(token);
      setUser(me);
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(SESSION_TOKEN_KEY);
      setToken(null);
      setUser(null);
    }
  };

  useEffect(() => {
    void refreshUser();
  }, [token]);

  const loginWithPassword = async (payload: { email: string; password: string; role: UserRole; rememberMe?: boolean }) => {
    const result = await login({ email: payload.email, password: payload.password, role: payload.role });
    const rememberMe = payload.rememberMe ?? true;
    if (rememberMe) {
      localStorage.setItem(TOKEN_KEY, result.access_token);
      sessionStorage.removeItem(SESSION_TOKEN_KEY);
    } else {
      sessionStorage.setItem(SESSION_TOKEN_KEY, result.access_token);
      localStorage.removeItem(TOKEN_KEY);
    }
    setToken(result.access_token);
    setUser(result.user);
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(SESSION_TOKEN_KEY);
    setToken(null);
    setUser(null);
  };

  const value = useMemo(
    () => ({ token, user, loginWithPassword, logout, refreshUser }),
    [token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
