import { useEffect, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";

import { apiRequest } from "../services/api.js";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    apiRequest("/notifications/my")
      .then((data) => { if (active) setNotifications(data.notifications || []); })
      .catch((requestError) => { if (active) setError(requestError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const markRead = async (id) => {
    setError("");
    try {
      const data = await apiRequest(`/notifications/${id}/read`, { method: "PATCH" });
      setNotifications((current) => current.map((notification) => notification._id === id ? data.notification : notification));
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const markAllRead = async () => {
    setError("");
    try {
      await apiRequest("/notifications/read-all", { method: "PATCH" });
      setNotifications((current) => current.map((notification) => ({ ...notification, isRead: true })));
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  return <section className="workspace-page">
    <header className="workspace-page-heading"><div><p className="hero-label">HOMEHIVE</p><h1>Notifications</h1><p>Booking and service updates for your account.</p></div><Bell size={22} /></header>
    {!!notifications.some((item) => !item.isRead) && <button className="workspace-button secondary notification-read-all" onClick={markAllRead}><CheckCheck size={15} /> Mark all read</button>}
    {error && <p className="workspace-alert" role="alert">{error}</p>}
    {loading ? <p className="workspace-muted">Loading notifications...</p> : !notifications.length ? <div className="workspace-empty"><strong>You’re all caught up</strong><p>New booking and service updates will appear here.</p></div> : <div className="notification-list">{notifications.map((item) => <article className={`notification-row ${item.isRead ? "read" : "unread"}`} key={item._id}><div className="notification-row-icon"><Bell size={16} /></div><div className="notification-row-content"><strong>{item.title}</strong><p>{item.message}</p><time>{new Date(item.createdAt).toLocaleString()}</time></div>{!item.isRead && <button className="workspace-button secondary" onClick={() => markRead(item._id)}>Mark read</button>}</article>)}</div>}
  </section>;
}
