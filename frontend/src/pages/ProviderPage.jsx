import { useEffect, useState } from "react";
import { BriefcaseBusiness, CalendarDays, Save } from "lucide-react";

import { apiRequest } from "../services/api.js";

const emptyProfile = { businessName: "", skills: "", categories: "", experience: "0", hourlyRate: "0", location: "", serviceAreas: "", description: "" };
const minimumAvailabilityDate = new Date().toISOString().slice(0, 10);

export default function ProviderPage() {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(emptyProfile);
  const [availability, setAvailability] = useState([]);
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    apiRequest("/providers/me")
      .then(({ provider }) => {
        if (!active) return;
        setProfile(provider);
        setForm(toForm(provider));
        return apiRequest(`/availability/provider/${provider._id}`);
      })
      .then((data) => { if (active && data) setAvailability(data.availability || []); })
      .catch((requestError) => {
        if (active && requestError.status !== 404) setError(requestError.message);
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const saveProfile = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const body = {
        businessName: form.businessName.trim(),
        skills: parseList(form.skills),
        categories: parseList(form.categories),
        experience: Number(form.experience || 0),
        hourlyRate: Number(form.hourlyRate || 0),
        location: form.location.trim(),
        serviceAreas: parseList(form.serviceAreas),
        description: form.description.trim()
      };
      const data = profile
        ? await apiRequest("/providers/me", { method: "PATCH", body })
        : await apiRequest("/providers", { method: "POST", body });
      setProfile(data.provider);
      setForm(toForm(data.provider));
      setNotice(profile ? "Provider profile updated." : "Provider profile created.");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  const saveAvailability = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const timeSlots = parseList(slots).map((time) => ({ time, isBooked: false }));
      const data = await apiRequest("/availability", {
        method: "POST",
        body: { date, timeSlots }
      });
      setAvailability((current) => [...current.filter((item) => new Date(item.date).toISOString().slice(0, 10) !== date), data.availability].sort((left, right) => new Date(left.date) - new Date(right.date)));
      setNotice("Availability saved.");
      setSlots("");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageHeading><p className="workspace-muted">Loading provider profile...</p></PageHeading>;

  return <PageHeading>
    {error && <p className="workspace-alert" role="alert">{error}</p>}
    {notice && <p className="workspace-success" role="status">{notice}</p>}
    <form className="workspace-section provider-profile-form" onSubmit={saveProfile}>
      <div className="workspace-section-heading"><div><h2><BriefcaseBusiness size={17} /> Provider profile</h2><p>Share your skills and service area with customers.</p></div></div>
      <div className="workspace-form-grid">
        <Field label="Business name" value={form.businessName} onChange={(businessName) => setForm((current) => ({ ...current, businessName }))} required />
        <Field label="Location" value={form.location} onChange={(location) => setForm((current) => ({ ...current, location }))} required />
        <Field label="Skills (comma separated)" value={form.skills} onChange={(skills) => setForm((current) => ({ ...current, skills }))} placeholder="AC repair, installation" />
        <Field label="Categories (comma separated)" value={form.categories} onChange={(categories) => setForm((current) => ({ ...current, categories }))} placeholder="Repair, Maintenance" />
        <Field label="Experience (years)" type="number" min="0" value={form.experience} onChange={(experience) => setForm((current) => ({ ...current, experience }))} />
        <Field label="Hourly rate" type="number" min="0" value={form.hourlyRate} onChange={(hourlyRate) => setForm((current) => ({ ...current, hourlyRate }))} />
        <Field label="Service areas (comma separated)" value={form.serviceAreas} onChange={(serviceAreas) => setForm((current) => ({ ...current, serviceAreas }))} />
        <Field label="Description" value={form.description} onChange={(description) => setForm((current) => ({ ...current, description }))} />
      </div>
      <button className="workspace-button primary provider-save" disabled={saving}><Save size={15} />{saving ? "Saving..." : profile ? "Save profile" : "Create profile"}</button>
    </form>

    {profile && <>
      <form className="workspace-section provider-profile-form" onSubmit={saveAvailability}>
        <div className="workspace-section-heading"><div><h2><CalendarDays size={17} /> Availability</h2><p>Set the dates and times customers can request.</p></div></div>
        <div className="workspace-form-grid">
          <label className="workspace-field"><span>Date</span><input type="date" min={minimumAvailabilityDate} value={date} onChange={(event) => setDate(event.target.value)} required /></label>
          <Field label="Times (comma separated)" value={slots} onChange={setSlots} placeholder="09:00, 13:00, 16:00" required />
        </div>
        <button className="workspace-button primary provider-save" disabled={saving || !slots.trim()}>{saving ? "Saving..." : "Save availability"}</button>
      </form>
      <section className="provider-availability-list"><h2>Published availability</h2>{availability.length ? availability.map((item) => <article key={item._id}><strong>{new Date(item.date).toLocaleDateString()}</strong><span>{item.timeSlots.filter((slot) => !slot.isBooked).map((slot) => slot.time).join(" · ") || "No open times"}</span></article>) : <p className="workspace-muted">No availability dates published.</p>}</section>
    </>}
  </PageHeading>;
}

function PageHeading({ children }) {
  return <section className="workspace-page"><header className="workspace-page-heading"><div><p className="hero-label">HOMEHIVE</p><h1>Provider workspace</h1><p>Manage your public profile and appointment availability.</p></div><BriefcaseBusiness size={22} /></header>{children}</section>;
}

function Field({ label, value, onChange, type = "text", required = false, min, placeholder = "" }) {
  return <label className="workspace-field"><span>{label}</span><input type={type} min={min} value={value} onChange={(event) => onChange(event.target.value)} required={required} placeholder={placeholder} /></label>;
}

function parseList(value) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function toForm(profile) {
  return {
    businessName: profile.businessName || "",
    skills: (profile.skills || []).join(", "),
    categories: (profile.categories || []).join(", "),
    experience: String(profile.experience || 0),
    hourlyRate: String(profile.hourlyRate || 0),
    location: profile.location || "",
    serviceAreas: (profile.serviceAreas || []).join(", "),
    description: profile.description || ""
  };
}
