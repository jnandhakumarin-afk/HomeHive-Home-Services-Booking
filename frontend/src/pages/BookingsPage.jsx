import { useEffect, useState } from "react";
import { CalendarDays, Check, Clock3, X } from "lucide-react";

import { apiRequest } from "../services/api.js";

const statusLabels = {
  requested: "Pending provider approval",
  accepted: "Awaiting customer approval",
  rejected: "Rejected",
  customer_approved: "Customer approved",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled"
};

export default function BookingsPage({ user }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const endpoint = user.role === "provider" ? "/bookings/provider" : "/bookings/my";
    apiRequest(endpoint)
      .then((data) => { if (active) setBookings(data.bookings || []); })
      .catch((requestError) => { if (active) setError(requestError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [user.role]);

  const updateBooking = async (bookingId, status) => {
    const data = await apiRequest(`/bookings/${bookingId}/status`, {
      method: "PATCH",
      body: { status }
    });
    setBookings((current) => current.map((booking) => booking._id === bookingId ? data.booking : booking));
  };

  return (
    <section className="workspace-page">
      <header className="workspace-page-heading"><div><p className="hero-label">HOMEHIVE</p><h1>Bookings</h1><p>Follow requests from approval through completion.</p></div><CalendarDays size={22} /></header>
      {error && <p className="workspace-alert" role="alert">{error}</p>}
      {loading ? <p className="workspace-muted">Loading bookings...</p> : bookings.length === 0 ? <EmptyState title="No bookings yet" detail="Your service requests and appointments will appear here." /> : (
        <div className="booking-list">
          {bookings.map((booking) => <BookingCard key={booking._id} booking={booking} role={user.role} onUpdate={updateBooking} />)}
        </div>
      )}
    </section>
  );
}

function BookingCard({ booking, role, onUpdate }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [reportForm, setReportForm] = useState({ problem: booking.description || "", workPerformed: "", parts: "", labourCost: "", serviceCost: "", tax: "", warrantyDays: "", nextServiceDue: "", notes: "" });
  const [reviewForm, setReviewForm] = useState({ rating: "5", comment: "" });
  const [bill, setBill] = useState(null);
  const [billForm, setBillForm] = useState({ labour: "", service: "", parts: "", tax: "" });

  useEffect(() => {
    if (role !== "provider" || booking.status !== "completed") return undefined;

    let active = true;
    apiRequest(`/bills/booking/${booking._id}`)
      .then((data) => { if (active) setBill(data.bill); })
      .catch((requestError) => {
        if (active && requestError.status !== 404) setError(requestError.message);
      });

    return () => { active = false; };
  }, [booking._id, booking.status, role]);

  const act = async (status) => {
    setBusy(true);
    setError("");
    try {
      await onUpdate(booking._id, status);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  const addReport = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const partsReplaced = reportForm.parts.split("\n").map((line) => line.trim()).filter(Boolean).map((line) => {
        const [name, cost = "0"] = line.split(",");
        return { name: name.trim(), cost: Number(cost.trim()) };
      });
      await apiRequest("/service-reports", {
        method: "POST",
        body: {
          booking: booking._id,
          problem: reportForm.problem,
          workPerformed: reportForm.workPerformed,
          partsReplaced,
          labourCost: Number(reportForm.labourCost || 0),
          serviceCost: Number(reportForm.serviceCost || 0),
          tax: Number(reportForm.tax || 0),
          total: Number(reportForm.labourCost || 0) + Number(reportForm.serviceCost || 0) + Number(reportForm.tax || 0) + partsReplaced.reduce((sum, part) => sum + part.cost, 0),
          warrantyDays: Number(reportForm.warrantyDays || 0),
          nextServiceDue: reportForm.nextServiceDue || undefined,
          notes: reportForm.notes
        }
      });
      setNotice("Service report saved to the appliance passport.");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  const addReview = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await apiRequest("/reviews", {
        method: "POST",
        body: { booking: booking._id, rating: Number(reviewForm.rating), comment: reviewForm.comment }
      });
      setNotice("Thanks. Your review was submitted.");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  const createBill = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    const parts = billForm.parts.split("\n").map((line) => line.trim()).filter(Boolean).map((line) => {
      const [description, price = "0"] = line.split(",");
      return { description: description.trim(), quantity: 1, unitPrice: Number(price.trim()) };
    });
    const items = [
      ...(Number(billForm.labour) > 0 ? [{ description: "Labour", quantity: 1, unitPrice: Number(billForm.labour) }] : []),
      ...(Number(billForm.service) > 0 ? [{ description: "Service charge", quantity: 1, unitPrice: Number(billForm.service) }] : []),
      ...parts
    ];

    try {
      const data = await apiRequest("/bills", {
        method: "POST",
        body: { booking: booking._id, items, tax: Number(billForm.tax || 0) }
      });
      setBill(data.bill);
      setNotice("Itemized bill created for the customer.");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  const canReview = role === "customer" && booking.status === "completed";
  const canReport = role === "provider" && booking.status === "completed";
  const canCreateBill = role === "provider" && booking.status === "completed";

  return (
    <article className="booking-card workspace-section">
      <div className="booking-card-heading">
        <div><p>{formatDate(booking.date)} · {booking.time}</p><h2>{booking.service?.name || "Home service"}</h2></div>
        <span className={`booking-status status-${booking.status}`}>{statusLabels[booking.status] || booking.status}</span>
      </div>
      <div className="booking-participants">
        <span>{role === "provider" ? `Customer: ${booking.customer?.name || "Customer"}` : `Provider: ${booking.provider?.businessName || "Provider"}`}</span>
        <span>Appliance: {booking.appliance?.name || "Not specified"}</span>
        <span>{booking.home?.name || "Home"}{booking.home?.city ? ` · ${booking.home.city}` : ""}</span>
      </div>
      {booking.description && <p className="booking-description">{booking.description}</p>}

      <div className="booking-actions">
        {role === "provider" && booking.status === "requested" && <>
          <button className="workspace-button primary" disabled={busy} onClick={() => act("accepted")}><Check size={15} /> Accept</button>
          <button className="workspace-button danger" disabled={busy} onClick={() => act("rejected")}><X size={15} /> Reject</button>
        </>}
        {role === "customer" && booking.status === "accepted" && <button className="workspace-button primary" disabled={busy} onClick={() => act("customer_approved")}><Check size={15} /> Approve service</button>}
        {role === "customer" && ["requested", "accepted"].includes(booking.status) && <button className="workspace-button danger" disabled={busy} onClick={() => act("cancelled")}><X size={15} /> Cancel</button>}
        {role === "provider" && booking.status === "customer_approved" && <button className="workspace-button primary" disabled={busy} onClick={() => act("in_progress")}><Clock3 size={15} /> Start service</button>}
        {role === "provider" && booking.status === "in_progress" && <button className="workspace-button primary" disabled={busy} onClick={() => act("completed")}><Check size={15} /> Mark completed</button>}
      </div>

      {canReport && <form className="booking-report-form" onSubmit={addReport}>
        <h3>Service report</h3>
        <div className="workspace-form-grid">
          <Field label="Problem" value={reportForm.problem} onChange={(problem) => setReportForm((current) => ({ ...current, problem }))} />
          <Field label="Work performed" value={reportForm.workPerformed} onChange={(workPerformed) => setReportForm((current) => ({ ...current, workPerformed }))} required />
          <Field label="Labour cost" type="number" min="0" value={reportForm.labourCost} onChange={(labourCost) => setReportForm((current) => ({ ...current, labourCost }))} />
          <Field label="Service cost" type="number" min="0" value={reportForm.serviceCost} onChange={(serviceCost) => setReportForm((current) => ({ ...current, serviceCost }))} />
          <Field label="Tax" type="number" min="0" value={reportForm.tax} onChange={(tax) => setReportForm((current) => ({ ...current, tax }))} />
          <Field label="Warranty days" type="number" min="0" value={reportForm.warrantyDays} onChange={(warrantyDays) => setReportForm((current) => ({ ...current, warrantyDays }))} />
          <Field label="Next service due" type="date" value={reportForm.nextServiceDue} onChange={(nextServiceDue) => setReportForm((current) => ({ ...current, nextServiceDue }))} />
          <Field label="Parts (one per line: name, cost)" value={reportForm.parts} onChange={(parts) => setReportForm((current) => ({ ...current, parts }))} />
        </div>
        <label className="workspace-field"><span>Notes</span><textarea rows="2" value={reportForm.notes} onChange={(event) => setReportForm((current) => ({ ...current, notes: event.target.value }))} /></label>
        <button className="workspace-button primary" disabled={busy}>{busy ? "Saving..." : "Save service report"}</button>
      </form>}

      {canReview && <form className="booking-review-form" onSubmit={addReview}>
        <h3>Rate this service</h3>
        <div className="workspace-form-grid">
          <label className="workspace-field"><span>Rating</span><select value={reviewForm.rating} onChange={(event) => setReviewForm((current) => ({ ...current, rating: event.target.value }))}>{[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} star{rating === 1 ? "" : "s"}</option>)}</select></label>
          <Field label="Review" value={reviewForm.comment} onChange={(comment) => setReviewForm((current) => ({ ...current, comment }))} />
        </div>
        <button className="workspace-button secondary" disabled={busy}>{busy ? "Submitting..." : "Submit review"}</button>
      </form>}
      {canCreateBill && bill && <p className="workspace-success" role="status">Bill recorded: {formatCurrency(bill.totalAmount)} · {bill.paymentStatus}</p>}
      {canCreateBill && !bill && <form className="booking-review-form" onSubmit={createBill}>
        <h3>Create itemized bill</h3>
        <div className="workspace-form-grid">
          <Field label="Labour amount" type="number" min="0" value={billForm.labour} onChange={(labour) => setBillForm((current) => ({ ...current, labour }))} />
          <Field label="Service charge" type="number" min="0" value={billForm.service} onChange={(service) => setBillForm((current) => ({ ...current, service }))} />
          <Field label="Tax" type="number" min="0" value={billForm.tax} onChange={(tax) => setBillForm((current) => ({ ...current, tax }))} />
          <Field label="Parts (one per line: name, cost)" value={billForm.parts} onChange={(parts) => setBillForm((current) => ({ ...current, parts }))} />
        </div>
        <button className="workspace-button primary" disabled={busy || (!Number(billForm.labour) && !Number(billForm.service) && !billForm.parts.trim())}>{busy ? "Creating..." : "Create bill"}</button>
      </form>}
      {error && <p className="workspace-alert" role="alert">{error}</p>}
      {notice && <p className="workspace-success" role="status">{notice}</p>}
    </article>
  );
}

function Field({ label, value, onChange, type = "text", required = false, min }) {
  return <label className="workspace-field"><span>{label}</span><input type={type} min={min} value={value} onChange={(event) => onChange(event.target.value)} required={required} /></label>;
}

function EmptyState({ title, detail }) {
  return <div className="workspace-empty"><strong>{title}</strong><p>{detail}</p></div>;
}

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString() : "Date not set";
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(Number(value || 0));
}
