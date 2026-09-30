import { useEffect, useRef, useState } from "react";
import { Banknote, CheckCircle, Clock, Download, QrCode, X } from "lucide-react";
import QRCode from "qrcode";
import { jsPDF } from "jspdf";

import { apiRequest } from "../services/api.js";

const STATUS_LABEL = {
  pending: "Payment Pending",
  payment_submitted: "Payment Submitted — Awaiting Verification",
  paid: "Paid",
  failed: "Failed"
};

const STATUS_CLASS = {
  pending: "",
  payment_submitted: "status-customer_approved",
  paid: "status-completed",
  failed: "status-cancelled"
};

export default function BillingPage({ user }) {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchBills = async () => {
    try {
      const data = await apiRequest("/bills");
      setBills(data.bills || []);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, []);

  const updateBill = (updated) => {
    setBills((current) => current.map((b) => (b._id === updated._id ? updated : b)));
  };

  return (
    <section className="workspace-page">
      <header className="workspace-page-heading">
        <div>
          <p className="hero-label">HOMEHIVE</p>
          <h1>Billing & Payments</h1>
          <p>
            {user?.role === "provider"
              ? "Customer bills for your completed services. Verify payments and mark as paid."
              : "View itemized service charges, pay via UPI QR or cash, and track verification status."}
          </p>
        </div>
        <Banknote size={22} />
      </header>

      {error && <p className="workspace-alert" role="alert">{error}</p>}

      {loading ? (
        <p className="workspace-muted">Loading bills...</p>
      ) : bills.length === 0 ? (
        <div className="workspace-empty">
          <strong>No bills yet</strong>
          <p>
            {user?.role === "provider"
              ? "Bills you generate for completed services will appear here."
              : "Itemized bills will appear here once your services are completed."}
          </p>
        </div>
      ) : (
        <div className="billing-list">
          {bills.map((bill) => (
            <BillCard
              key={bill._id}
              bill={bill}
              role={user?.role}
              onUpdate={updateBill}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function BillCard({ bill, role, onUpdate }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showPayModal, setShowPayModal] = useState(false);

  const booking = bill.booking || {};
  const service = booking.service || {};
  const appliance = booking.appliance || {};
  const home = booking.home || {};
  const provider = bill.provider || {};
  const customer = bill.customer || {};

  const handleMarkPaid = async (paymentMethod = "upi") => {
    setBusy(true);
    setError("");
    try {
      const data = await apiRequest(`/bills/${bill._id}/payment`, {
        method: "PATCH",
        body: { paymentStatus: "paid", paymentMethod }
      });
      onUpdate(data.bill);
      setNotice("Bill marked as Paid. Customer has been notified.");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  const downloadPdf = () => {
    try {
      const doc = new jsPDF();
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.text("HomeHive - Service Invoice", 20, 25);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Invoice ID: ${bill._id}`, 20, 35);
      doc.text(`Date: ${new Date(bill.createdAt).toLocaleDateString("en-IN")}`, 20, 42);
      doc.text(`Status: ${(STATUS_LABEL[bill.paymentStatus] || bill.paymentStatus).toUpperCase()}`, 20, 49);

      doc.setLineWidth(0.5);
      doc.line(20, 54, 190, 54);

      doc.setFont("helvetica", "bold");
      doc.text("Customer Details:", 20, 62);
      doc.setFont("helvetica", "normal");
      doc.text(`Name: ${customer.name || "Customer"}`, 20, 69);
      doc.text(`Phone: ${customer.phone || "—"}`, 20, 76);
      doc.text(`Address: ${[home.name, home.address, home.city].filter(Boolean).join(", ") || "—"}`, 20, 83);

      doc.setFont("helvetica", "bold");
      doc.text("Service Provider:", 110, 62);
      doc.setFont("helvetica", "normal");
      doc.text(`Provider: ${provider.businessName || "HomeHive Technician"}`, 110, 69);
      doc.text(`UPI ID: ${provider.upiId || "Not set"}`, 110, 76);
      doc.text(`Service: ${service.name || "Home Service"}`, 110, 83);

      doc.line(20, 90, 190, 90);

      doc.setFont("helvetica", "bold");
      doc.text("Itemized Breakdown", 20, 98);
      doc.text("Qty", 140, 98);
      doc.text("Amount (INR)", 165, 98);

      let yPos = 106;
      doc.setFont("helvetica", "normal");
      (bill.items || []).forEach((item) => {
        doc.text(item.description || "Service Charge", 20, yPos);
        doc.text(String(item.quantity || 1), 142, yPos);
        doc.text(`INR ${Number(item.amount || 0).toFixed(2)}`, 165, yPos);
        yPos += 8;
      });

      doc.line(20, yPos + 2, 190, yPos + 2);
      yPos += 10;

      doc.text(`Subtotal: INR ${Number(bill.subtotal || 0).toFixed(2)}`, 140, yPos);
      yPos += 6;
      doc.text(`Tax: INR ${Number(bill.tax || 0).toFixed(2)}`, 140, yPos);
      yPos += 8;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text(`Grand Total: INR ${Number(bill.totalAmount || 0).toFixed(2)}`, 140, yPos);

      if (bill.paymentStatus === "paid" && bill.paidAt) {
        yPos += 12;
        doc.setFontSize(10);
        doc.setTextColor(34, 197, 94);
        doc.text(`PAID on ${new Date(bill.paidAt).toLocaleDateString("en-IN")} via ${(bill.paymentMethod || "UPI").toUpperCase()}`, 20, yPos);
        if (bill.transactionId) {
          yPos += 6;
          doc.text(`Transaction Reference: ${bill.transactionId}`, 20, yPos);
        }
      }

      doc.save(`HomeHive_Invoice_${bill._id.slice(-6)}.pdf`);
    } catch (pdfError) {
      console.error("PDF generation error:", pdfError);
    }
  };

  return (
    <article className="workspace-section billing-card">
      <header className="billing-card-heading">
        <div>
          <p>{new Date(bill.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
          <h2>{service.name || "Home Service Bill"}</h2>
          {(appliance.name || home.name) && (
            <p style={{ fontSize: "13px", color: "var(--text-soft)", margin: "3px 0 0" }}>
              {[appliance.name, appliance.brand, home.name, home.city].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
        <span className={`booking-status ${STATUS_CLASS[bill.paymentStatus] || ""}`}>
          {STATUS_LABEL[bill.paymentStatus] || bill.paymentStatus}
        </span>
      </header>

      {/* Booking and Bill info */}
      <div className="booking-participants">
        {role === "provider" ? (
          <span>Customer: <strong>{customer.name || "—"}</strong>{customer.phone ? ` · ${customer.phone}` : ""}</span>
        ) : (
          <span>Provider: <strong>{provider.businessName || "—"}</strong>{provider.upiId ? ` · UPI: ${provider.upiId}` : ""}</span>
        )}
        {booking.date && (
          <span>Service Date: {new Date(booking.date).toLocaleDateString()}{booking.time ? ` at ${booking.time}` : ""}</span>
        )}
        {bill.paymentMethod && bill.paymentMethod !== "none" && (
          <span>Method: <strong>{bill.paymentMethod.toUpperCase()}</strong></span>
        )}
        {bill.transactionId && (
          <span>UTR / Ref: <strong>{bill.transactionId}</strong></span>
        )}
        {bill.paidAt && (
          <span>Paid: {new Date(bill.paidAt).toLocaleDateString()}</span>
        )}
      </div>

      {/* Itemized charges */}
      <div className="billing-items">
        {(bill.items || []).map((item, index) => (
          <div key={`${item.description}-${index}`}>
            <span>
              {item.description} <small>× {item.quantity}</small>
            </span>
            <strong>{formatCurrency(item.amount)}</strong>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="billing-totals">
        <div><span>Subtotal</span><strong>{formatCurrency(bill.subtotal)}</strong></div>
        {bill.tax > 0 && <div><span>Tax</span><strong>{formatCurrency(bill.tax)}</strong></div>}
        <div className="billing-grand-total"><span>Grand Total</span><strong>{formatCurrency(bill.totalAmount)}</strong></div>
      </div>

      {/* Action buttons */}
      <div className="booking-actions">
        {/* Customer: pay via UPI or Cash */}
        {role === "customer" && bill.paymentStatus === "pending" && (
          <button className="workspace-button primary" type="button" onClick={() => setShowPayModal(true)}>
            <QrCode size={15} /> Pay via UPI / Cash
          </button>
        )}

        {/* Customer: payment awaiting verification */}
        {role === "customer" && bill.paymentStatus === "payment_submitted" && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-soft)", fontSize: "13px" }}>
            <Clock size={16} /> Payment submitted (Ref: {bill.transactionId || "Cash"}) — awaiting provider verification
          </div>
        )}

        {/* Customer: verified & paid */}
        {role === "customer" && bill.paymentStatus === "paid" && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--green)", fontSize: "13px" }}>
            <CheckCircle size={16} /> Payment Verified & Paid
          </div>
        )}

        {/* Provider: verify customer submission */}
        {role === "provider" && bill.paymentStatus === "payment_submitted" && (
          <button className="workspace-button primary" type="button" disabled={busy} onClick={() => handleMarkPaid(bill.paymentMethod || "upi")}>
            <CheckCircle size={15} /> {busy ? "Verifying..." : `Verify & Mark as Paid (${(bill.paymentMethod || "UPI").toUpperCase()})`}
          </button>
        )}

        {/* Provider: mark as paid for cash on service */}
        {role === "provider" && bill.paymentStatus === "pending" && (
          <button className="workspace-button secondary" type="button" disabled={busy} onClick={() => handleMarkPaid("cash")}>
            {busy ? "Updating..." : "Mark as Paid (Cash)"}
          </button>
        )}

        {/* Download Invoice PDF */}
        <button className="workspace-button secondary" type="button" onClick={downloadPdf}>
          <Download size={15} /> Download Invoice
        </button>
      </div>

      {error && <p className="workspace-alert" role="alert">{error}</p>}
      {notice && <p className="workspace-success" role="status">{notice}</p>}

      {/* Dedicated UPI / Cash Payment Modal */}
      {showPayModal && (
        <UpiPaymentModal
          bill={bill}
          onClose={() => setShowPayModal(false)}
          onPaymentSubmitted={(updated) => {
            onUpdate(updated);
            setShowPayModal(false);
            setNotice("Payment proof submitted! Provider will verify and mark as Paid.");
          }}
        />
      )}
    </article>
  );
}

function UpiPaymentModal({ bill, onClose, onPaymentSubmitted }) {
  const [step, setStep] = useState("method"); // "method" | "upi" | "cash"
  const [transactionId, setTransactionId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const canvasRef = useRef(null);
  const [qrRendered, setQrRendered] = useState(false);

  const provider = bill.provider || {};
  const upiId = provider.upiId || "";
  const amount = Number(bill.totalAmount || 0);
  const providerName = encodeURIComponent(provider.businessName || "HomeHive Provider");

  // Dynamic UPI payment URI specification
  const upiUri = upiId
    ? `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${providerName}&am=${amount.toFixed(2)}&cu=INR&tn=HomeHive%20Payment`
    : "";

  useEffect(() => {
    if (step === "upi" && upiUri && canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, upiUri, {
        width: 220,
        margin: 2,
        color: { dark: "#0f172a", light: "#ffffff" }
      })
        .then(() => setQrRendered(true))
        .catch((qrError) => {
          console.error("QR Code canvas generation failed:", qrError);
        });
    }
  }, [step, upiUri]);

  const submitUpiPayment = async () => {
    if (!transactionId.trim()) {
      setError("Please enter the UPI Transaction ID / UTR number from your payment app.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const data = await apiRequest(`/bills/${bill._id}/payment`, {
        method: "PATCH",
        body: {
          paymentStatus: "payment_submitted",
          paymentMethod: "upi",
          transactionId: transactionId.trim()
        }
      });
      onPaymentSubmitted(data.bill);
    } catch (requestError) {
      setError(requestError.message);
      setBusy(false);
    }
  };

  const submitCashPayment = async () => {
    setBusy(true);
    setError("");
    try {
      const data = await apiRequest(`/bills/${bill._id}/payment`, {
        method: "PATCH",
        body: {
          paymentStatus: "payment_submitted",
          paymentMethod: "cash",
          transactionId: "Cash On Service"
        }
      });
      onPaymentSubmitted(data.bill);
    } catch (requestError) {
      setError(requestError.message);
      setBusy(false);
    }
  };

  return (
    <div className="location-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="location-modal-card" style={{ maxWidth: "460px" }} onClick={(e) => e.stopPropagation()}>
        <header className="location-modal-header">
          <div>
            <h3>Pay Service Bill</h3>
            <p>{formatCurrency(amount)} · {provider.businessName || "Home Service"}</p>
          </div>
          <button className="location-modal-close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </header>

        {/* Step 1: Choose Payment Method */}
        {step === "method" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <p style={{ color: "var(--text-soft)", fontSize: "13px", margin: 0 }}>
              Select your preferred payment method:
            </p>

            {upiId ? (
              <button
                className="location-detect-btn"
                type="button"
                onClick={() => setStep("upi")}
                style={{ justifyContent: "center" }}
              >
                <QrCode size={18} />
                Pay via UPI ({upiId})
              </button>
            ) : (
              <div style={{ background: "var(--page-bg)", border: "1px solid var(--border)", borderRadius: "10px", padding: "12px", fontSize: "13px", color: "var(--text-soft)" }}>
                Provider has not added a UPI ID yet. You can pay via Cash on Service below.
              </div>
            )}

            <button
              type="button"
              className="workspace-button secondary"
              style={{ padding: "12px", borderRadius: "12px", fontWeight: 600, fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
              onClick={() => setStep("cash")}
            >
              💵 Cash on Service
            </button>
          </div>
        )}

        {/* Step 2A: Dynamic UPI QR Code & UTR Input */}
        {step === "upi" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", alignItems: "center" }}>
            <div
              style={{
                background: "var(--page-bg)",
                border: "1px solid var(--border)",
                borderRadius: "16px",
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "10px",
                width: "100%"
              }}
            >
              <p style={{ fontWeight: 700, fontSize: "15px", margin: 0 }}>Scan QR to Pay</p>
              <p style={{ color: "var(--text-soft)", fontSize: "13px", margin: 0 }}>
                UPI ID: <strong style={{ color: "var(--text)" }}>{upiId}</strong>
              </p>
              <p style={{ color: "var(--primary)", fontWeight: 700, fontSize: "24px", margin: 0 }}>
                {formatCurrency(amount)}
              </p>

              <div style={{ background: "#ffffff", padding: "10px", borderRadius: "12px", display: "inline-block" }}>
                <canvas ref={canvasRef} width={220} height={220} style={{ display: "block" }} />
              </div>

              {!qrRendered && (
                <p className="workspace-muted" style={{ fontSize: "12px", margin: 0 }}>
                  Generating UPI QR code...
                </p>
              )}

              <p style={{ fontSize: "12px", color: "var(--text-soft)", textAlign: "center", margin: 0 }}>
                Scan with GPay, PhonePe, Paytm, or any UPI app.<br />
                Provider: <strong>{provider.businessName || "HomeHive"}</strong>
              </p>

              {upiUri && (
                <a
                  href={upiUri}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    background: "var(--primary)",
                    color: "#ffffff",
                    padding: "10px 20px",
                    borderRadius: "10px",
                    fontWeight: 600,
                    fontSize: "14px",
                    textDecoration: "none",
                    marginTop: "4px"
                  }}
                >
                  Open in UPI App
                </a>
              )}
            </div>

            <label className="workspace-field" style={{ width: "100%" }}>
              <span>UPI Transaction ID / UTR <small>(after completing payment)</small></span>
              <input
                type="text"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="e.g. 123456789012 or T2506XXXXX"
                autoFocus
              />
            </label>

            {error && <p className="workspace-alert" role="alert" style={{ width: "100%", margin: 0 }}>{error}</p>}

            <div style={{ display: "flex", gap: "10px", width: "100%" }}>
              <button type="button" className="workspace-button secondary" style={{ flex: 1 }} onClick={() => setStep("method")}>
                Back
              </button>
              <button type="button" className="workspace-button primary" style={{ flex: 2 }} disabled={busy} onClick={submitUpiPayment}>
                {busy ? "Submitting..." : "Submit Payment Proof"}
              </button>
            </div>
          </div>
        )}

        {/* Step 2B: Cash on Service */}
        {step === "cash" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ background: "var(--page-bg)", border: "1px solid var(--border)", borderRadius: "12px", padding: "18px" }}>
              <p style={{ fontWeight: 700, margin: "0 0 8px" }}>Cash on Service</p>
              <p style={{ color: "var(--text-soft)", fontSize: "13px", margin: 0 }}>
                Pay <strong>{formatCurrency(amount)}</strong> directly in cash to the provider upon completion.
                The provider will verify receipt and mark this bill as PAID.
              </p>
            </div>

            {error && <p className="workspace-alert" role="alert">{error}</p>}

            <div style={{ display: "flex", gap: "10px" }}>
              <button type="button" className="workspace-button secondary" style={{ flex: 1 }} onClick={() => setStep("method")}>
                Back
              </button>
              <button type="button" className="workspace-button primary" style={{ flex: 2 }} disabled={busy} onClick={submitCashPayment}>
                {busy ? "Submitting..." : "Confirm Cash Payment"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(value || 0));
}
