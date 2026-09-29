import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, MapPin, Star, Wrench } from "lucide-react";

import { apiRequest } from "../services/api.js";

const serviceCategories = ["Repair", "Plumbing", "Electrical", "Cleaning", "Beauty", "Carpentry", "Maintenance"];
const minimumBookingDate = new Date().toISOString().slice(0, 10);

function getId(value) {
  return value?._id || value || "";
}

export default function ServicesPage({ user, initialCategory = "Repair", searchTerm = "" }) {
  const [services, setServices] = useState([]);
  const [providers, setProviders] = useState([]);
  const [homes, setHomes] = useState([]);
  const [assets, setAssets] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [providerReviews, setProviderReviews] = useState([]);
  const [category, setCategory] = useState(initialCategory);
  const [locationQuery, setLocationQuery] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [providerId, setProviderId] = useState("");
  const [showProviderDetails, setShowProviderDetails] = useState(false);
  const [homeId, setHomeId] = useState("");
  const [applianceId, setApplianceId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const bookingFormRef = useRef(null);

  useEffect(() => {
    let active = true;

    Promise.all([
      apiRequest("/services"),
      apiRequest("/providers"),
      apiRequest("/homes"),
      apiRequest("/passport/assets")
    ])
      .then(([serviceData, providerData, homeData, assetData]) => {
        if (!active) return;
        const nextServices = serviceData.services || [];
        setServices(nextServices);
        setProviders(providerData.providers || []);
        setHomes(homeData.homes || []);
        setAssets(assetData.assets || assetData.appliances || []);
        setHomeId(homeData.homes?.[0]?._id || "");
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!providerId) return undefined;

    let active = true;
    apiRequest(`/providers/${providerId}/availability`)
      .then((data) => { if (active) setAvailability(data.availability || []); })
      .catch((requestError) => { if (active) setError(requestError.message); });

    return () => { active = false; };
  }, [providerId]);

  useEffect(() => {
    if (!providerId) return undefined;

    let active = true;
    apiRequest(`/reviews/provider/${providerId}`)
      .then((data) => { if (active) setProviderReviews(data.reviews || []); })
      .catch((requestError) => { if (active) setError(requestError.message); });

    return () => { active = false; };
  }, [providerId]);

  const visibleServices = useMemo(
    () => services.filter((service) =>
      service.category === category &&
      (!searchTerm.trim() || `${service.name} ${service.description || ""}`.toLowerCase().includes(searchTerm.trim().toLowerCase()))
    ),
    [category, searchTerm, services]
  );
  const activeServiceId = visibleServices.some((service) => service._id === serviceId)
    ? serviceId
    : visibleServices[0]?._id || "";

  const visibleProviders = useMemo(() => providers.filter((provider) => {
    const categories = provider.categories || [];
    const skills = provider.skills || [];
    const matchesCategory = categories.some((item) => item.toLowerCase() === category.toLowerCase()) ||
      skills.some((item) => item.toLowerCase().includes(category.toLowerCase())) ||
      (category === "Repair" && skills.length > 0);
    const providerAreas = [provider.location, ...(provider.serviceAreas || [])].filter(Boolean).join(" ").toLowerCase();
    const searchableProfile = `${provider.businessName} ${skills.join(" ")} ${categories.join(" ")}`.toLowerCase();
    return matchesCategory &&
      (!locationQuery.trim() || providerAreas.includes(locationQuery.trim().toLowerCase())) &&
      (!searchTerm.trim() || searchableProfile.includes(searchTerm.trim().toLowerCase()));
  }), [category, locationQuery, providers, searchTerm]);
  const selectedProvider = providers.find((provider) => provider._id === providerId);

  const selectedAvailability = availability.find((item) =>
    new Date(item.date).toISOString().slice(0, 10) === date
  );
  const availableTimes = (selectedAvailability?.timeSlots || [])
    .filter((slot) => !slot.isBooked)
    .map((slot) => slot.time);
  const homeAssets = assets.filter((asset) => getId(asset.home) === homeId);

  const selectProvider = (provider, focusBooking = false) => {
    setProviderId(provider._id);
    setShowProviderDetails(true);
    setAvailability([]);
    setDate("");
    setTime("");
    if (focusBooking) {
      requestAnimationFrame(() => bookingFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    }
  };

  const submitBooking = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!activeServiceId || !providerId || !homeId || !applianceId || !date || !time) {
      setError("Choose a service, provider, home, appliance, date, and available time.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await apiRequest("/bookings", {
        method: "POST",
        body: { service: activeServiceId, provider: providerId, home: homeId, appliance: applianceId, date, time, description }
      });
      setMessage(result.message || "Booking request sent.");
      setTime("");
      setDescription("");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <PageShell title="Services" detail="Find the right help for your home."><p className="workspace-muted">Loading services and providers...</p></PageShell>;

  return (
    <PageShell title="Services" detail="Compare local providers and request a time that works for you.">
      <div className="workspace-toolbar" role="group" aria-label="Service category">
        {serviceCategories.map((item) => (
          <button key={item} type="button" className={`category-chip ${category === item ? "active" : ""}`} onClick={() => { setCategory(item); setProviderId(""); setShowProviderDetails(false); setAvailability([]); setDate(""); setTime(""); }}>
            {item}
          </button>
        ))}
      </div>
      <label className="workspace-search-field"><MapPin size={16} /><input value={locationQuery} onChange={(event) => setLocationQuery(event.target.value)} placeholder="Filter providers by city or service area" aria-label="Filter providers by city or service area" /></label>

      {error && <p className="workspace-alert" role="alert">{error}</p>}
      {message && <p className="workspace-success" role="status">{message}</p>}

      <div className="workspace-columns">
        <section className="workspace-section">
          <div className="workspace-section-heading">
            <div><h2>{category} providers</h2><p>{visibleProviders.length} available profiles</p></div>
          </div>

          {visibleProviders.length === 0 ? (
            <EmptyState title="No matching providers yet" detail="Try another category or check back after providers complete their profiles." />
          ) : (
            <div className="provider-list">
              {visibleProviders.map((provider) => (
                <article className={`provider-row ${providerId === provider._id ? "selected" : ""}`} key={provider._id}>
                  <div className="provider-avatar">{(provider.businessName || "P").slice(0, 1).toUpperCase()}</div>
                  <div className="provider-summary">
                    <h3>{provider.businessName}</h3>
                    <p>{(provider.skills || []).join(" · ") || "Home service provider"}</p>
                    <div className="provider-meta">
                      <span><Star size={14} fill="currentColor" /> {Number(provider.rating || 0).toFixed(1)} ({provider.totalReviews || 0})</span>
                      <span>{provider.experience || 0} years</span>
                      <span><MapPin size={14} /> {provider.location || (provider.serviceAreas || []).join(", ") || "Service area not listed"}</span>
                      <span>{provider.completedJobs || 0} jobs</span>
                      <span>{formatCurrency(provider.hourlyRate)} / hour</span>
                      {!!provider.categories?.length && <span>{provider.categories.join(", ")}</span>}
                    </div>
                  </div>
                  <div className="provider-row-actions">
                    <button className="workspace-button secondary" type="button" aria-expanded={providerId === provider._id && showProviderDetails} onClick={() => {
                      if (providerId === provider._id && showProviderDetails) {
                        setShowProviderDetails(false);
                        return;
                      }
                      selectProvider(provider);
                    }}>
                      {providerId === provider._id && showProviderDetails ? "Hide profile" : "View profile"}
                    </button>
                    {user.role === "customer" && <button className="workspace-button primary" type="button" onClick={() => selectProvider(provider, true)}>Book</button>}
                  </div>
                </article>
              ))}
            </div>
          )}
          {selectedProvider && showProviderDetails && <section className="provider-reviews">
            <div className="provider-detail-summary">
              <strong>{selectedProvider.experience || 0} years experience · {selectedProvider.completedJobs || 0} completed jobs</strong>
              <p>{selectedProvider.description || "No provider description has been added."}</p>
              <p>{(selectedProvider.serviceAreas || []).join(", ") || selectedProvider.location || "Service area not listed"} · {formatCurrency(selectedProvider.hourlyRate)} / hour</p>
              {selectedProvider.user?.email && <a href={`mailto:${selectedProvider.user.email}`}>Email provider</a>}
              {selectedProvider.user?.phone && <a href={`tel:${selectedProvider.user.phone}`}>Call provider</a>}
              {user.role === "customer" && <button className="workspace-button primary" type="button" onClick={() => selectProvider(selectedProvider, true)}>Book this provider</button>}
            </div>
            <div className="workspace-section-heading"><div><h2>{selectedProvider.businessName} reviews</h2><p>{providerReviews.length} customer reviews</p></div></div>
            {!providerReviews.length ? <p className="workspace-muted">No reviews yet.</p> : providerReviews.slice(0, 4).map((review) => <article key={review._id}><strong>{review.customer?.name || "Customer"} · {review.rating}/5</strong><p>{review.comment || "No written comment"}</p></article>)}
          </section>}
        </section>

        <form ref={bookingFormRef} className="workspace-section booking-form" onSubmit={submitBooking}>
          <div className="workspace-section-heading">
            <div><h2>Request a booking</h2><p>Requests start as pending provider approval.</p></div>
            <CalendarDays size={20} />
          </div>

          <label className="workspace-field">
            <span>Service</span>
            <select value={activeServiceId} onChange={(event) => setServiceId(event.target.value)} required>
              <option value="">Choose {category.toLowerCase()} service</option>
              {visibleServices.map((service) => <option key={service._id} value={service._id}>{service.name}</option>)}
            </select>
          </label>

          {user.role === "customer" && <>
            <label className="workspace-field">
              <span>Home</span>
              <select value={homeId} onChange={(event) => { setHomeId(event.target.value); setApplianceId(""); }} required>
                <option value="">Choose a home</option>
                {homes.map((home) => <option key={home._id} value={home._id}>{home.name} · {home.city}</option>)}
              </select>
            </label>
            <label className="workspace-field">
              <span>Appliance</span>
              <select value={applianceId} onChange={(event) => setApplianceId(event.target.value)} required>
                <option value="">Choose an appliance</option>
                {homeAssets.map((asset) => <option key={asset._id} value={asset._id}>{asset.name} · {asset.brand || asset.category}</option>)}
              </select>
            </label>
            <div className="workspace-form-grid">
              <label className="workspace-field">
                <span>Date</span>
                <input type="date" min={minimumBookingDate} value={date} onChange={(event) => { setDate(event.target.value); setTime(""); }} required />
              </label>
              <label className="workspace-field">
                <span>Available time</span>
                <select value={time} onChange={(event) => setTime(event.target.value)} disabled={!selectedAvailability} required>
                  <option value="">{selectedAvailability ? "Choose a time" : "Choose provider and date"}</option>
                  {availableTimes.map((slot) => <option key={slot} value={slot}>{slot}</option>)}
                </select>
              </label>
            </div>
            {selectedAvailability && availableTimes.length === 0 && <p className="workspace-muted">No open times for this date.</p>}
            <label className="workspace-field">
              <span>Describe the issue <small>Optional</small></span>
              <textarea rows="3" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What should the provider know?" />
            </label>
            <button className="workspace-button primary" type="submit" disabled={submitting || !homes.length || !homeAssets.length}>
              {submitting ? "Sending request..." : "Request booking"}
            </button>
            {!homes.length && <p className="workspace-muted">Add a home and appliance in Service Passport before booking.</p>}
            {homes.length > 0 && !homeAssets.length && <p className="workspace-muted">Add an appliance to this home before booking.</p>}
          </>}
          {user.role !== "customer" && <p className="workspace-muted">Provider/admin accounts can browse the service catalog. Customers submit bookings from this panel.</p>}
        </form>
      </div>
    </PageShell>
  );
}

function PageShell({ title, detail, children }) {
  return (
    <section className="workspace-page">
      <header className="workspace-page-heading"><div><p className="hero-label">HOMEHIVE</p><h1>{title}</h1><p>{detail}</p></div><Wrench size={22} /></header>
      {children}
    </section>
  );
}

function EmptyState({ title, detail }) {
  return <div className="workspace-empty"><strong>{title}</strong><p>{detail}</p></div>;
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(value || 0));
}
