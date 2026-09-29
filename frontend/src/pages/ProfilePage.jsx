import { useState } from "react";

import { useAuth } from "../context/auth.js";

export default function ProfilePage() {
  const { user, updateProfile, logout } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState(() => ({
    name: user?.name || "",
    phone: user?.phone || "",
    location: user?.location || ""
  }));

  const save = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");
    setSaving(true);
    try {
      const updated = await updateProfile(form);
      setForm({ name: updated.name || "", phone: updated.phone || "", location: updated.location || "" });
      setEditing(false);
      setNotice("Profile updated.");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  return <section className="workspace-page">
    <header className="workspace-page-heading"><div><p className="hero-label">HOMEHIVE</p><h1>Profile</h1><p>Your verified account details and access role.</p></div><div className="profile-avatar">{(user?.name || "H").slice(0, 1).toUpperCase()}</div></header>
    {error && <p className="workspace-alert" role="alert">{error}</p>}
    {notice && <p className="workspace-success" role="status">{notice}</p>}
    <section className="workspace-section profile-details">
      {editing ? <form onSubmit={save}>
        <Field label="Name" value={form.name} onChange={(name) => setForm((current) => ({ ...current, name }))} required />
        <Field label="Phone" value={form.phone} onChange={(phone) => setForm((current) => ({ ...current, phone }))} />
        <Field label="Location" value={form.location} onChange={(location) => setForm((current) => ({ ...current, location }))} />
        <div className="profile-actions">
          <button className="workspace-button primary" disabled={saving}>{saving ? "Saving..." : "Save profile"}</button>
          <button className="workspace-button secondary" type="button" disabled={saving} onClick={() => { setForm({ name: user.name || "", phone: user.phone || "", location: user.location || "" }); setEditing(false); setError(""); }}>Cancel</button>
        </div>
      </form> : <>
        <Fact label="Name" value={user?.name} />
        <Fact label="Email" value={user?.email} />
        <Fact label="Phone" value={user?.phone || "Not provided"} />
        <Fact label="Location" value={user?.location || "Not provided"} />
        <Fact label="Role" value={user?.role} />
        <button className="workspace-button primary" onClick={() => setEditing(true)}>Edit profile</button>
      </>}
      <button className="workspace-button secondary" onClick={logout}>Sign out</button>
    </section>
  </section>;
}

function Field({ label, value, onChange, required = false }) {
  return <label className="workspace-field"><span>{label}</span><input value={value} onChange={(event) => onChange(event.target.value)} required={required} /></label>;
}

function Fact({ label, value }) {
  return <div className="profile-fact"><span>{label}</span><strong>{value}</strong></div>;
}
