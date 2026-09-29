import { useEffect, useState } from "react";
import { Banknote } from "lucide-react";

import { apiRequest } from "../services/api.js";

export default function BillingPage() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    apiRequest("/passport/assets")
      .then(async (assetData) => {
        const assets = assetData.assets || assetData.appliances || [];
        const passports = await Promise.all(assets.map((asset) => apiRequest(`/passport/assets/${asset._id}/history`)));
        if (!active) return;
        const uniqueBills = new Map();
        passports.forEach((data) => (data.passport?.bills || []).forEach((bill) => uniqueBills.set(bill._id, bill)));
        setBills([...uniqueBills.values()].sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt)));
      })
      .catch((requestError) => { if (active) setError(requestError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return (
    <section className="workspace-page">
      <header className="workspace-page-heading"><div><p className="hero-label">HOMEHIVE</p><h1>Billing</h1><p>Itemized service charges and payment status.</p></div><Banknote size={22} /></header>
      {error && <p className="workspace-alert" role="alert">{error}</p>}
      {loading ? <p className="workspace-muted">Loading bills...</p> : bills.length === 0 ? <div className="workspace-empty"><strong>No bills yet</strong><p>Completed service bills will appear here.</p></div> : <div className="billing-list">{bills.map((bill) => <BillCard key={bill._id} bill={bill} onUpdate={(updated) => setBills((current) => current.map((item) => item._id === updated._id ? updated : item))} />)}</div>}
    </section>
  );
}

function BillCard({ bill, onUpdate }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const markPaid = async () => {
    setBusy(true);
    setError("");
    try {
      const data = await apiRequest(`/bills/${bill._id}/payment`, {
        method: "PATCH",
        body: { paymentStatus: "paid" }
      });
      onUpdate(data.bill);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  return <article className="workspace-section billing-card">
    <header className="billing-card-heading"><div><p>{new Date(bill.createdAt).toLocaleDateString()}</p><h2>Service bill</h2></div><span className={`booking-status ${bill.paymentStatus === "paid" ? "status-completed" : ""}`}>{bill.paymentStatus}</span></header>
    <div className="billing-items">{bill.items.map((item, index) => <div key={`${item.description}-${index}`}><span>{item.description} <small>× {item.quantity}</small></span><strong>{formatCurrency(item.amount)}</strong></div>)}</div>
    <div className="billing-totals"><div><span>Subtotal</span><strong>{formatCurrency(bill.subtotal)}</strong></div><div><span>Tax</span><strong>{formatCurrency(bill.tax)}</strong></div><div className="billing-grand-total"><span>Total</span><strong>{formatCurrency(bill.totalAmount)}</strong></div></div>
    {bill.paymentStatus === "pending" && <button className="workspace-button primary" type="button" disabled={busy} onClick={markPaid}>{busy ? "Updating..." : "Mark as paid"}</button>}
    {error && <p className="workspace-alert" role="alert">{error}</p>}
  </article>;
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(Number(value || 0));
}
