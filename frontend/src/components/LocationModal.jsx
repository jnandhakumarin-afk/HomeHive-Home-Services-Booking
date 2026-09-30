import { useEffect, useState } from "react";
import { Check, Crosshair, MapPin, Search, X } from "lucide-react";

const POPULAR_CITIES = [
  "Bengaluru",
  "Chennai",
  "Mumbai",
  "Delhi NCR",
  "Hyderabad",
  "Pune",
  "Kolkata",
  "Coimbatore"
];

export default function LocationModal({ selectedLocation, onSelect, onClose }) {
  const [query, setQuery] = useState("");
  const [loadingLoc, setLoadingLoc] = useState(false);
  const [error, setError] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // Debounced search for manual city search using OpenStreetMap Nominatim
  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setSuggestions([]);
      return undefined;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      setError("");
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            query.trim()
          )}&countrycodes=in&limit=5&addressdetails=1`,
          { headers: { "Accept-Language": "en" } }
        );
        if (!res.ok) throw new Error("Location lookup failed");
        const data = await res.json();
        const mapped = data.map((item) => {
          const city =
            item.address?.city ||
            item.address?.town ||
            item.address?.state_district ||
            item.address?.suburb ||
            item.name;
          const state = item.address?.state || "";
          return {
            city,
            formattedAddress: item.display_name,
            state,
            lat: item.lat,
            lon: item.lon
          };
        });
        setSuggestions(mapped);
      } catch (err) {
        console.error("Location search error:", err);
      } finally {
        setSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [query]);

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }

    setLoadingLoc(true);
    setError("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=14&addressdetails=1`,
            { headers: { "Accept-Language": "en" } }
          );
          if (!res.ok) throw new Error("Reverse geocoding failed");
          const data = await res.json();
          const city =
            data.address?.city ||
            data.address?.town ||
            data.address?.suburb ||
            data.address?.state_district ||
            data.address?.state ||
            "My Location";

          onSelect({
            city,
            formattedAddress: data.display_name,
            lat: latitude,
            lon: longitude,
            state: data.address?.state || ""
          });
        } catch {
          onSelect({
            city: "Current Location",
            formattedAddress: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
            lat: latitude,
            lon: longitude
          });
        } finally {
          setLoadingLoc(false);
        }
      },
      (geoError) => {
        setLoadingLoc(false);
        if (geoError.code === geoError.PERMISSION_DENIED) {
          setError("Location permission denied. Please allow location access or choose a city below.");
        } else {
          setError("Could not retrieve your location. Please select a city below.");
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleSelectCity = (cityName) => {
    onSelect({
      city: cityName,
      formattedAddress: `${cityName}, India`,
      isPopular: true
    });
  };

  const handleSelectSuggestion = (item) => {
    onSelect(item);
  };

  return (
    <div className="location-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="location-modal-card" onClick={(e) => e.stopPropagation()}>
        <header className="location-modal-header">
          <div>
            <h3>Select Service Area</h3>
            <p>Providers in your selected location will be prioritized.</p>
          </div>
          <button className="location-modal-close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </header>

        {/* Current Location Button */}
        <button
          className="location-detect-btn"
          type="button"
          disabled={loadingLoc}
          onClick={handleUseCurrentLocation}
        >
          <Crosshair size={18} />
          <span>{loadingLoc ? "Detecting location..." : "Use my current location"}</span>
        </button>

        {error && <p className="workspace-alert" role="alert" style={{ margin: "10px 0 0" }}>{error}</p>}

        {/* Search Field */}
        <div className="location-search-wrap" style={{ marginTop: "16px" }}>
          <Search size={16} />
          <input
            type="text"
            placeholder="Search city, area, or pin code..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
        </div>

        {/* Autocomplete Suggestions */}
        {searching && <p className="workspace-muted" style={{ fontSize: "12px", margin: "6px 0 0" }}>Searching areas...</p>}

        {suggestions.length > 0 && (
          <ul className="location-suggestions-list">
            {suggestions.map((item, index) => (
              <li key={`${item.formattedAddress}-${index}`} onClick={() => handleSelectSuggestion(item)}>
                <MapPin size={15} />
                <div>
                  <strong>{item.city}</strong>
                  <p>{item.formattedAddress}</p>
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* Popular Cities */}
        <div className="popular-cities-wrap" style={{ marginTop: "20px" }}>
          <p className="popular-label">Popular service regions:</p>
          <div className="popular-chips">
            {POPULAR_CITIES.map((city) => {
              const isSelected = selectedLocation?.city?.toLowerCase() === city.toLowerCase();
              return (
                <button
                  key={city}
                  type="button"
                  className={`popular-chip ${isSelected ? "selected" : ""}`}
                  onClick={() => handleSelectCity(city)}
                >
                  {isSelected && <Check size={12} />}
                  {city}
                </button>
              );
            })}
          </div>
        </div>

        {/* Currently selected location badge */}
        {selectedLocation && (
          <div className="current-selected-box">
            <MapPin size={15} />
            <span>
              Active: <strong>{selectedLocation.city}</strong>
              {selectedLocation.state ? ` (${selectedLocation.state})` : ""}
            </span>
            <button
              type="button"
              className="location-clear-btn"
              onClick={() => onSelect(null)}
              title="Clear selection"
            >
              Clear
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
