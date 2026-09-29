import { useEffect, useState } from "react";
import { MessageCircle, Send } from "lucide-react";

import { apiRequest } from "../services/api.js";

export default function MessagesPage({ user }) {
  const [bookings, setBookings] = useState([]);
  const [selectedBookingId, setSelectedBookingId] = useState("");
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const selectedBooking = bookings.find((booking) => booking._id === selectedBookingId) || bookings[0];
  const peer = user.role === "provider" ? selectedBooking?.customer : selectedBooking?.provider?.user;
  const peerId = typeof peer === "object" ? peer?._id : peer;
  const peerName = user.role === "provider"
    ? selectedBooking?.customer?.name || "Customer"
    : selectedBooking?.provider?.businessName || "Provider";

  useEffect(() => {
    let active = true;
    apiRequest(user.role === "provider" ? "/bookings/provider" : "/bookings/my")
      .then((data) => { if (active) setBookings(data.bookings || []); })
      .catch((requestError) => { if (active) setError(requestError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [user.role]);

  useEffect(() => {
    if (!peerId) return undefined;
    let active = true;
    apiRequest(`/messages/conversation/${peerId}`)
      .then((data) => { if (active) setMessages(data.messages || []); })
      .catch((requestError) => { if (active) setError(requestError.message); });
    apiRequest(`/messages/conversation/${peerId}/read`, { method: "PATCH" })
      .catch(() => {});
    return () => { active = false; };
  }, [peerId]);

  const send = async (event) => {
    event.preventDefault();
    if (!draft.trim() || !selectedBooking || !peerId) return;
    setError("");
    try {
      await apiRequest("/messages", {
        method: "POST",
        body: { receiver: peerId, booking: selectedBooking._id, message: draft.trim() }
      });
      const data = await apiRequest(`/messages/conversation/${peerId}`);
      setMessages(data.messages || []);
      setDraft("");
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  return <section className="workspace-page">
    <header className="workspace-page-heading"><div><p className="hero-label">HOMEHIVE</p><h1>Messages</h1><p>Discuss details with the other person on your booking.</p></div><MessageCircle size={22} /></header>
    {error && <p className="workspace-alert" role="alert">{error}</p>}
    {loading ? <p className="workspace-muted">Loading conversations...</p> : !bookings.length ? <div className="workspace-empty"><strong>No booking conversations</strong><p>Messages become available after a service request is created.</p></div> : <section className="workspace-section message-panel">
      <label className="workspace-field"><span>Booking conversation</span><select value={selectedBooking?._id || ""} onChange={(event) => { setMessages([]); setSelectedBookingId(event.target.value); }}>
        {bookings.map((booking) => <option key={booking._id} value={booking._id}>{booking.service?.name || "Home service"} · {user.role === "provider" ? booking.customer?.name : booking.provider?.businessName}</option>)}
      </select></label>
      <div className="message-heading"><div><strong>{peerName}</strong><span>{selectedBooking?.status?.replaceAll("_", " ")}</span></div></div>
      <div className="message-list" aria-live="polite">
        {!messages.length ? <p className="workspace-muted">No messages yet. Start the conversation about this booking.</p> : messages.map((message) => {
          const senderId = typeof message.sender === "object" ? message.sender?._id : message.sender;
          return <article className={`message-bubble ${senderId === user._id ? "mine" : ""}`} key={message._id}><p>{message.message}</p><time>{new Date(message.createdAt).toLocaleString()}</time></article>;
        })}
      </div>
      <form className="message-compose" onSubmit={send}><input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Write a message..." aria-label="Message" required /><button className="workspace-button primary" disabled={!draft.trim()} aria-label="Send message"><Send size={16} /></button></form>
    </section>}
  </section>;
}
