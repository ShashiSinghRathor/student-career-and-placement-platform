import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import api, { getError } from "../services/api";
import { connectSocket, disconnectSocket, getSocket } from "../services/socket";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("cc_token");
    if (!token) return setLoading(false);
    api
      .get("/auth/me")
      .then((res) => {
        setUser(res.data.user);
        connectSocket(token);
      })
      .catch(() => localStorage.removeItem("cc_token"))
      .finally(() => setLoading(false));
  }, []);

  const ingest = useCallback(({ token, user }) => {
    localStorage.setItem("cc_token", token);
    setUser(user);
    connectSocket(token);
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      const res = await api.post("/auth/login", { email, password });
      ingest(res.data);
      return { ok: true, user: res.data.user };
    } catch (e) {
      return { ok: false, error: getError(e) };
    }
  }, [ingest]);

  const register = useCallback(async (payload) => {
    try {
      const res = await api.post("/auth/register", payload);
      ingest(res.data);
      return { ok: true, user: res.data.user };
    } catch (e) {
      return {
        ok: false,
        error: getError(e),
        fieldErrors: e?.response?.data?.errors,
      };
    }
  }, [ingest]);

  const logout = useCallback(async () => {
    try { await api.post("/auth/logout"); } catch { /* ignore */ }
    localStorage.removeItem("cc_token");
    disconnectSocket();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const res = await api.get("/auth/me");
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const value = useMemo(
    () => ({ user, setUser, loading, login, register, logout, refreshUser }),
    [user, loading, login, register, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
