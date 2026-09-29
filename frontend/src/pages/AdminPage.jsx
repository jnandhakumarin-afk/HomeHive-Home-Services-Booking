import { useEffect, useState } from "react";
import { Activity, Banknote, BriefcaseBusiness, ClipboardList, Users } from "lucide-react";

import { apiRequest } from "../services/api.js";

const adminViews = {
  overview: { label: "Overview", endpoint: "/admin/dashboard", key: "stats" },
  users: { label: "Customers", endpoint: "/admin/users", key: "users" },
  providers: { label: "Providers", endpoint: "/admin/providers", key: "providers" },
  bookings: { label: "Bookings", endpoint: "/admin/bookings", key: "bookings" },
  services: { label: "Services", endpoint: "/admin/services", key: "services" },
  bills: { label: "Bills", endpoint: "/admin/bills", key: "bills" },
  activity: { label: "Service activity", endpoint: "/admin/service-reports", key: "reports" }
};

export default function AdminPage() {
  const [view, setView] = useState("overview");
  const [result, setResult] = useState(null);
  const [errors, setErrors] = useState({});
  const [settledView, setSettledView] = useState(null);
  const currentView = adminViews[view];
  const loading = settledView !== view;
  const error = errors[view];

  useEffect(() => {
    let active = true;
    apiRequest(currentView.endpoint)
      .then((data) => {
        if (!active) return;
        setResult({ view, data });
        setErrors((current) => ({ ...current, [view]: "" }));
        setSettledView(view);
      })
      .catch((requestError) => {
        if (!active) return;
        setErrors((current) => ({ ...current, [view]: requestError.message }));
        setSettledView(view);
      });
    return () => { active = false; };
  }, [currentView.endpoint, view]);

  const data = result?.view === view ? result.data : null;
  const stats = data?.stats;
  const rows = view === "users"
    ? (data?.users || []).filter((user) => user.role === "customer")
    : data?.[currentView.key];

  return (
    <section className="workspace-page">
      <header className="workspace-page-heading"><div><p className="hero-label">HOMEHIVE ADMIN</p><h1>Operations</h1><p>Platform activity and service records.</p></div><Activity size={22} /></header>
      <div className="admin-tabs" role="tablist" aria-label="Admin sections">
        {Object.entries(adminViews).map(([key, item]) => <button type="button" role="tab" aria-selected={view === key} className={view === key ? "active" : ""} key={key} onClick={() => setView(key)}>{item.label}</button>)}
      </div>
      {error && <p className="workspace-alert" role="alert">{error}</p>}
      {loading ? <p className="workspace-muted">Loading platform data...</p> : view === "overview" ? (
        <div className="admin-stats-grid">
          <Stat icon={Users} label="Users" value={stats?.totalUsers} />
          <Stat icon={BriefcaseBusiness} label="Providers" value={stats?.totalProviders} />
          <Stat icon={ClipboardList} label="Bookings" value={stats?.totalBookings} />
          <Stat icon={Activity} label="Completed" value={stats?.completedBookings} />
          <Stat icon={Banknote} label="Pending bookings" value={stats?.pendingBookings} />
          <Stat icon={ClipboardList} label="Service types" value={stats?.totalServices} />
        </div>
      ) : <AdminTable view={view} rows={rows || []} />}
    </section>
  );
}

function Stat({ icon: Icon, label, value }) {
  return <article className="admin-stat"><span><Icon size={18} /></span><div><small>{label}</small><strong>{value ?? "—"}</strong></div></article>;
}

function AdminTable({ view, rows }) {
  if (!rows.length) return <div className="workspace-empty"><strong>No records yet</strong><p>New {adminViews[view].label.toLowerCase()} will appear here.</p></div>;

  const columns = {
    users: ["name", "email", "phone", "role"],
    providers: ["businessName", "skills", "experience", "rating", "location"],
    bookings: ["service", "customer", "provider", "date", "status"],
    services: ["name", "category", "description", "isActive"],
    bills: ["customer", "provider", "totalAmount", "paymentStatus", "createdAt"],
    activity: ["appliance", "customer", "provider", "serviceDate", "total"]
  }[view];

  return <div className="admin-table-scroll"><table className="admin-table"><thead><tr>{columns.map((column) => <th key={column}>{humanize(column)}</th>)}</tr></thead><tbody>{rows.map((row) => <tr key={row._id}>{columns.map((column) => <td key={column}>{formatCell(row[column], column)}</td>)}</tr>)}</tbody></table></div>;
}

function formatCell(value, column) {
  if (value == null || value === "") return "—";
  if (column === "skills") return Array.isArray(value) ? value.join(", ") : value;
  if (typeof value === "object" && !Array.isArray(value)) {
    return value.name || value.businessName || value.category || "—";
  }
  if (["date", "createdAt", "serviceDate"].includes(column)) return new Date(value).toLocaleDateString();
  if (column === "totalAmount" || column === "total") return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(Number(value));
  return String(value);
}

function humanize(value) {
  return value.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase());
}
