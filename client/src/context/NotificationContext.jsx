import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../services/api";
import { getSocket } from "../services/socket";
import { useAuth } from "./AuthContext";

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchAll = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await api.get("/notifications?limit=20");
      setNotifications(res.data.notifications);
      setUnread(res.data.unread);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line
  }, [user?._id]);

  // Real-time
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !user) return;
    const handler = (n) => {
      setNotifications((prev) => [n, ...prev].slice(0, 40));
      setUnread((u) => (n.read ? u : u + 1));
    };
    socket.on("notification", handler);
    return () => socket.off("notification", handler);
  }, [user?._id]);

  const markRead = async (id) => {
    setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
    setUnread((u) => Math.max(0, u - 1));
    try { await api.put(`/notifications/${id}/read`); } catch { /* ignore */ }
  };

  const markAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnread(0);
    try { await api.put("/notifications/read-all"); } catch { /* ignore */ }
  };

  const value = useMemo(() => ({ notifications, unread, fetchAll, markRead, markAllRead, loading }), [notifications, unread, loading]);
  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export const useNotifications = () => useContext(NotificationContext);
