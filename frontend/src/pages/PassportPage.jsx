import { useEffect, useState } from "react";
import { CalendarDays, Home, Plus, ShieldCheck } from "lucide-react";

import { apiRequest } from "../services/api.js";

export default function PassportPage() {
  const [homes, setHomes] = useState([]);
  const [assets, setAssets] = useState([]);
  const [selectedAssetId, setSelectedAssetId] = useState("");
  const [passport, setPassport] = useState(null);
  const [homeForm, setHomeForm] = useState({ name: "", address: "", city: "", pincode: "" });
  const [assetForm, setAssetForm] = useState({ home: "", name: "", category: "", brand: "", model: "", serialNumber: "", warrantyUntil: "" });
  const [showHomeForm, setShowHomeForm] = useState(false);
  const [showAssetForm, setShowAssetForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([apiRequest("/homes"), apiRequest("/passport/assets")])
      .then(([homeData, assetData]) => {
        if (!active) return;
        setHomes(homeData.homes || []);
        const nextAssets = assetData.assets || assetData.appliances || [];
        setAssets(nextAssets);
        setAssetForm((current) => ({ ...current, home: homeData.homes?.[0]?._id || "" }));
        if (nextAssets[0]) setSelectedAssetId(nextAssets[0]._id);
      })
      .catch((requestError) => { if (active) setError(requestError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!selectedAssetId) return undefined;

    let active = true;
    apiRequest(`/passport/assets/${selectedAssetId}/history`)
      .then((data) => { if (active) setPassport(data.passport); })
      .catch((requestError) => { if (active) setError(requestError.message); });
    return () => { active = false; };
  }, [selectedAssetId]);

  const createHome = async (event) => {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      const data = await apiRequest("/homes", { method: "POST", body: homeForm });
      const home = data.home;
      setHomes((current) => [...current, home]);
      setAssetForm((current) => ({ ...current, home: home._id }));
      setHomeForm({ name: "", address: "", city: "", pincode: "" });
      setShowHomeForm(false);
      setShowAssetForm(true);
      setNotice("Home added. Add an appliance to start its service passport.");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  const createAsset = async (event) => {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      const data = await apiRequest("/passport/assets", {
        method: "POST",
        body: assetForm
      });
      const appliance = data.appliance || data.asset;
      setAssets((current) => [appliance, ...current]);
      setSelectedAssetId(appliance._id);
      setAssetForm((current) => ({ ...current, name: "", category: "", brand: "", model: "", serialNumber: "", warrantyUntil: "" }));
      setShowAssetForm(false);
      setNotice("Appliance added to your service passport.");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  const updateAsset = async (event) => {
    event.preventDefault();
    if (!passport?.appliance?.id) return;
    setError("");
    setSaving(true);
    try {
      const data = await apiRequest(`/passport/assets/${passport.appliance.id}`, {
        method: "PATCH",
        body: {
          serialNumber: passport.appliance.serialNumber,
          warrantyUntil: passport.appliance.warrantyUntil,
          nextServiceDue: passport.appliance.nextServiceDate
        }
      });
      const appliance = data.appliance || data.asset;
      setAssets((current) => current.map((item) => item._id === appliance._id ? appliance : item));
      setNotice("Appliance details saved.");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageHeading><p className="workspace-muted">Loading your home passport...</p></PageHeading>;

  return (
    <PageHeading>
      <div className="passport-toolbar">
        <label className="workspace-field passport-picker">
          <span>Appliance</span>
          <select value={selectedAssetId} onChange={(event) => { setPassport(null); setSelectedAssetId(event.target.value); }}>
            <option value="">Choose an appliance</option>
            {assets.map((asset) => <option key={asset._id} value={asset._id}>{asset.name} · {asset.brand || asset.category}</option>)}
          </select>
        </label>
        <div className="passport-actions">
          <button className="workspace-button secondary" type="button" onClick={() => { setShowHomeForm((value) => !value); setShowAssetForm(false); }}><Plus size={15} /> Add home</button>
          {homes.length > 0 && <button className="workspace-button primary passport-add-button" type="button" onClick={() => { setShowAssetForm((value) => !value); setShowHomeForm(false); }}><Plus size={15} /> Add appliance</button>}
        </div>
      </div>

      {error && <p className="workspace-alert" role="alert">{error}</p>}
      {notice && <p className="workspace-success" role="status">{notice}</p>}

      {showHomeForm && <form className="workspace-section passport-form" onSubmit={createHome}>
        <h2><Home size={18} /> Register a home</h2>
        <div className="workspace-form-grid">
          <Field label="Home name" value={homeForm.name} onChange={(name) => setHomeForm((current) => ({ ...current, name }))} required />
          <Field label="City" value={homeForm.city} onChange={(city) => setHomeForm((current) => ({ ...current, city }))} required />
          <Field label="Address" value={homeForm.address} onChange={(address) => setHomeForm((current) => ({ ...current, address }))} required />
          <Field label="PIN code" value={homeForm.pincode} onChange={(pincode) => setHomeForm((current) => ({ ...current, pincode }))} required />
        </div>
        <button className="workspace-button primary" disabled={saving}>{saving ? "Saving..." : "Save home"}</button>
      </form>}

      {showAssetForm && <form className="workspace-section passport-form" onSubmit={createAsset}>
        <h2><Plus size={18} /> Add an appliance</h2>
        <div className="workspace-form-grid">
          <label className="workspace-field"><span>Home</span><select value={assetForm.home} onChange={(event) => setAssetForm((current) => ({ ...current, home: event.target.value }))} required>{homes.map((home) => <option key={home._id} value={home._id}>{home.name}</option>)}</select></label>
          <Field label="Appliance name" value={assetForm.name} onChange={(name) => setAssetForm((current) => ({ ...current, name }))} required placeholder="e.g. Living room AC" />
          <label className="workspace-field"><span>Type</span><select value={assetForm.category} onChange={(event) => setAssetForm((current) => ({ ...current, category: event.target.value }))} required><option value="">Choose type</option>{["AC", "Refrigerator", "Washing Machine", "TV", "Microwave", "Other"].map((type) => <option key={type}>{type}</option>)}</select></label>
          <Field label="Brand" value={assetForm.brand} onChange={(brand) => setAssetForm((current) => ({ ...current, brand }))} />
          <Field label="Model" value={assetForm.model} onChange={(model) => setAssetForm((current) => ({ ...current, model }))} />
          <Field label="Serial number" value={assetForm.serialNumber} onChange={(serialNumber) => setAssetForm((current) => ({ ...current, serialNumber }))} />
          <label className="workspace-field"><span>Warranty until</span><input type="date" value={assetForm.warrantyUntil} onChange={(event) => setAssetForm((current) => ({ ...current, warrantyUntil: event.target.value }))} /></label>
        </div>
        <button className="workspace-button primary" disabled={saving}>{saving ? "Saving..." : "Add to passport"}</button>
      </form>}

      {!assets.length && !showHomeForm && !showAssetForm ? (
        <EmptyState title="Your passport is ready for its first appliance" detail="Register your home, then add an appliance to start building its service history." />
      ) : passport ? <>
        <section className="passport-overview workspace-section">
          <div className="passport-overview-title"><div className="passport-overview-icon"><ShieldCheck size={21} /></div><div><p>{passport.home?.name || "My Home"} · {passport.home?.city || ""}</p><h2>{passport.appliance.name}</h2></div></div>
          <div className="passport-facts">
            <Fact label="Type" value={passport.appliance.category} />
            <Fact label="Brand / model" value={[passport.appliance.brand, passport.appliance.model].filter(Boolean).join(" · ") || "Not recorded"} />
            <Fact label="Last service" value={formatDate(passport.appliance.lastServiceDate)} />
            <Fact label="Next service due" value={formatDate(passport.appliance.nextServiceDate)} />
            <Fact label="Warranty until" value={formatDate(passport.appliance.warrantyUntil)} />
            <Fact label="Total spent" value={formatCurrency(passport.appliance.totalSpent)} />
          </div>
          <form className="passport-inline-form" onSubmit={updateAsset}>
            <label className="workspace-field"><span>Serial number</span><input value={passport.appliance.serialNumber || ""} onChange={(event) => setPassport((current) => ({ ...current, appliance: { ...current.appliance, serialNumber: event.target.value } }))} /></label>
            <label className="workspace-field"><span>Next service due</span><input type="date" value={passport.appliance.nextServiceDate ? new Date(passport.appliance.nextServiceDate).toISOString().slice(0, 10) : ""} onChange={(event) => setPassport((current) => ({ ...current, appliance: { ...current.appliance, nextServiceDate: event.target.value || null } }))} /></label>
            <button className="workspace-button secondary" disabled={saving}>Save details</button>
          </form>
        </section>

        <section className="passport-history-section">
          <div className="workspace-section-heading"><div><h2>Service history</h2><p>{passport.serviceHistory.length} recorded visits</p></div><CalendarDays size={19} /></div>
          {!passport.serviceHistory.length ? <EmptyState title="No service history yet" detail="Completed provider visits and service reports will appear here." /> : <div className="passport-history-list">
            {passport.serviceHistory.map((record) => <article className="passport-record" key={record._id}>
              <div className="passport-record-top"><div><p>{formatDate(record.serviceDate)}</p><h3>{record.provider?.businessName || "HomeHive provider"}</h3></div><strong>{formatCurrency(record.total ?? record.serviceCost)}</strong></div>
              {record.problem && <p className="passport-problem">{record.problem}</p>}
              <p className="passport-work">{record.workPerformed}</p>
              {record.partsReplaced?.length > 0 && <div className="passport-parts"><strong>Parts</strong>{record.partsReplaced.map((part, index) => <span key={`${part.name}-${index}`}>{part.name} · {formatCurrency(part.cost)}</span>)}</div>}
              <div className="passport-record-meta"><span>Labour {formatCurrency(record.labourCost)}</span><span>Service {formatCurrency(record.serviceCost)}</span><span>Tax {formatCurrency(record.tax)}</span><span>Warranty {record.warrantyDays || 0} days</span></div>
              {(record.notes || record.remarks) && <p className="passport-notes">{record.notes || record.remarks}</p>}
            </article>)}
          </div>}
          {!!passport.bills?.length && <div className="passport-bills"><h3>Bills</h3>{passport.bills.map((bill) => <article key={bill._id}><span>{new Date(bill.createdAt).toLocaleDateString()}</span><strong>{formatCurrency(bill.totalAmount)}</strong><span>{bill.paymentStatus}</span></article>)}</div>}
        </section>
      </> : null}
    </PageHeading>
  );
}

function PageHeading({ children }) {
  return <section className="workspace-page"><header className="workspace-page-heading"><div><p className="hero-label">HOMEHIVE</p><h1>Service Passport</h1><p>Appliance details, warranties, and service history for your home.</p></div><ShieldCheck size={22} /></header>{children}</section>;
}

function Field({ label, value, onChange, required = false, placeholder = "" }) {
  return <label className="workspace-field"><span>{label}</span><input value={value} onChange={(event) => onChange(event.target.value)} required={required} placeholder={placeholder} /></label>;
}

function Fact({ label, value }) {
  return <div className="passport-fact"><span>{label}</span><strong>{value || "Not recorded"}</strong></div>;
}

function EmptyState({ title, detail }) {
  return <div className="workspace-empty"><strong>{title}</strong><p>{detail}</p></div>;
}

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString() : "Not recorded";
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(Number(value || 0));
}
