
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import {
  Home,
  Grid2X2,
  Wrench,
  CalendarDays,
  Banknote,
  Bell,
  ShieldCheck,
  MessageCircle,
  UserRound,
  Settings,
  MessageSquare,
  Sun,
  Moon,
  Search,
  MapPin,
  ChevronDown,
  Plus,
  ArrowUpRight,
  Clock3,
  Star,
  Sparkles,
  Droplets,
  Zap,
  Snowflake,
  Check,
  Menu,
  X,
  LogOut,
} from "lucide-react";

import AuthPanel from "./components/AuthPanel.jsx";
import { useAuth } from "./context/auth.js";
import ServicesPage from "./pages/ServicesPage.jsx";
import PassportPage from "./pages/PassportPage.jsx";
import BookingsPage from "./pages/BookingsPage.jsx";
import AdminPage from "./pages/AdminPage.jsx";
import BillingPage from "./pages/BillingPage.jsx";
import ProviderPage from "./pages/ProviderPage.jsx";
import { apiRequest } from "./services/api.js";
import MessagesPage from "./pages/MessagesPage.jsx";
import NotificationsPage from "./pages/NotificationsPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";
import LocationModal from "./components/LocationModal.jsx";
import "./App.css";

const menuItems = [
  {
    name: "Dashboard",
    icon: Grid2X2,
  },
  {
    name: "Services",
    icon: Wrench,
  },
  {
    name: "Bookings",
    icon: CalendarDays,
  },
  {
    name: "Billing",
    icon: Banknote,
  },
  {
    name: "Notifications",
    icon: Bell,
  },
  {
    name: "Service Passport",
    icon: ShieldCheck,
  },
  {
    name: "Messages",
    icon: MessageCircle,
  },
  {
    name: "Profile",
    icon: UserRound,
  },
  {
    name: "Settings",
    icon: Settings,
  },
];

const quickServices = [
  {
    title: "Repair",
    subtitle: "Appliance & home repairs",
    icon: Wrench,
  },
  {
    title: "Plumbing",
    subtitle: "Pipes, taps & water issues",
    icon: Droplets,
  },
  {
    title: "Electrical",
    subtitle: "Wiring & electrical work",
    icon: Zap,
  },
  {
    title: "Cleaning",
    subtitle: "Home & deep cleaning",
    icon: Sparkles,
  },
  {
    title: "Beauty",
    subtitle: "Home beauty services",
    icon: Sparkles,
  },
];

function App() {
  const { user, isReady, login, register, logout } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedMenu = searchParams.get("page") || "Dashboard";
  const [serviceCategory, setServiceCategory] = useState("Repair");
  const [serviceSearchTerm, setServiceSearchTerm] = useState("");
  const [dashboardData, setDashboardData] = useState({ bookings: [], assets: [], reminders: [], notifications: [], provider: null, adminStats: null });
  const [dashboardError, setDashboardError] = useState("");

  const [darkMode, setDarkModeState] = useState(() => sessionStorage.getItem("homehive-theme") === "dark");

  const setDarkMode = (enabled) => {
    setDarkModeState(enabled);
    sessionStorage.setItem("homehive-theme", enabled ? "dark" : "light");
  };

  const [mobileMenu, setMobileMenu] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("homehive_selected_location") || "null") || null;
    } catch {
      return null;
    }
  });

  const handleSelectLocation = (loc) => {
    setSelectedLocation(loc);
    try {
      localStorage.setItem("homehive_selected_location", JSON.stringify(loc));
    } catch {
      // ignore
    }
    setShowLocationModal(false);
  };

  useEffect(() => {
    if (!user) return undefined;

    let active = true;
    const endpoints = user.role === "admin"
      ? [apiRequest("/admin/dashboard")]
      : user.role === "provider"
        ? [apiRequest("/bookings/provider"), apiRequest("/providers/me")]
        : [apiRequest("/bookings/my"), apiRequest("/passport/assets"), apiRequest("/reminders/my"), apiRequest("/notifications/my")];

    Promise.allSettled(endpoints)
      .then((results) => {
        if (!active) return;
        const values = results.map((result) => result.status === "fulfilled" ? result.value : null);
        const failed = results.find((result) => result.status === "rejected");
        if (failed) setDashboardError(failed.reason.message);
        if (user.role === "admin") {
          setDashboardData((current) => ({ ...current, adminStats: values[0]?.stats || null }));
        } else if (user.role === "provider") {
          setDashboardData((current) => ({ ...current, bookings: values[0]?.bookings || [], provider: values[1]?.provider || null }));
        } else {
          setDashboardData({
            bookings: values[0]?.bookings || [],
            assets: values[1]?.assets || values[1]?.appliances || [],
            reminders: values[2]?.reminders || [],
            notifications: values[3]?.notifications || [],
            provider: null,
            adminStats: null
          });
        }
      });

    return () => { active = false; };
  }, [user]);

  const handleMenuClick = (name) => {
    setSearchParams(name === "Dashboard" ? {} : { page: name });
    setMobileMenu(false);
  };

  const openServices = (category = "Repair") => {
    setServiceCategory(category);
    handleMenuClick("Services");
  };

  const roleMenuItems = menuItems.filter((item) =>
    (item.name !== "Billing" || user?.role === "customer") &&
    (item.name !== "Service Passport" || user?.role === "customer")
  );
  const navigationItems = user?.role === "admin"
    ? [...roleMenuItems, { name: "Admin", icon: ShieldCheck }]
    : user?.role === "provider"
      ? [...roleMenuItems, { name: "Provider Profile", icon: UserRound }]
      : roleMenuItems;
  const activeMenu = navigationItems.some((item) => item.name === requestedMenu)
    ? requestedMenu
    : "Dashboard";

  const completedBookings = dashboardData.bookings.filter((booking) => booking.status === "completed").length;
  const upcomingBookings = dashboardData.bookings.filter((booking) => ["requested", "accepted", "customer_approved"].includes(booking.status)).length;
  const nextDueAsset = dashboardData.assets
    .filter((asset) => asset.nextServiceDate)
    .sort((left, right) => Date.parse(left.nextServiceDate) - Date.parse(right.nextServiceDate))[0];
  const notificationCount = dashboardData.notifications.filter((notification) => !notification.isRead).length;

  if (!isReady) {
    return <div className="app light-mode auth-loading">Connecting to HomeHive...</div>;
  }

  if (!user) {
    return <AuthPanel onLogin={login} onRegister={register} />;
  }

  return (
    <div className={`app ${darkMode ? "dark-mode" : "light-mode"}`}>
      {/* ================= MOBILE HEADER ================= */}

      <div className="mobile-header">
        <button
          className="mobile-menu-btn"
          aria-label={mobileMenu ? "Close navigation" : "Open navigation"}
          onClick={() => setMobileMenu(!mobileMenu)}
        >
          {mobileMenu ? <X size={22} /> : <Menu size={22} />}
        </button>

        <div className="mobile-logo">
          <Home size={19} />
        </div>

        <div className="mobile-title">
          <strong>HomeHive</strong>
        </div>

        <button
          className="mobile-theme-btn"
          aria-label={darkMode ? "Switch to light theme" : "Switch to dark theme"}
          onClick={() => setDarkMode(!darkMode)}
        >
          {darkMode ? <Sun size={19} /> : <Moon size={19} />}
        </button>
      </div>

      {/* ================= SIDEBAR OVERLAY ================= */}

      {mobileMenu && (
        <div
          className="sidebar-overlay"
          onClick={() => setMobileMenu(false)}
        />
      )}

      {/* ================= FLOATING SIDEBAR ================= */}

      <aside className={`sidebar ${mobileMenu ? "mobile-open" : ""}`}>
        {/* Logo */}

        <button className="sidebar-logo" type="button" aria-label="Go to HomeHive dashboard" onClick={() => handleMenuClick("Dashboard")}>
          <Home size={22} />

          <span className="sidebar-brand-name">HomeHive</span>
        </button>

        {/* Navigation */}

        <nav className="sidebar-nav">
          {navigationItems.map((item) => {
            const Icon = item.icon;

            const isActive = activeMenu === item.name;
            const notification = item.name === "Notifications" ? notificationCount : item.notification;

            return (
              <button
                key={item.name}
                className={`side-item ${
                  isActive ? "selected" : ""
                }`}
                aria-label={item.name}
                title={item.name}
                onClick={() => handleMenuClick(item.name)}
              >
                <span className="side-icon">
                  <Icon
                    size={isActive ? 22 : 20}
                    strokeWidth={isActive ? 2.2 : 1.8}
                  />
                </span>

                <span className="side-name">{item.name}</span>

                {notification > 0 && (
                  <span className="side-notification">
                    {notification}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Bottom */}

        <div className="sidebar-bottom">
          {/* Theme */}

          <button
            className="side-bottom-btn"
            onClick={() => setDarkMode(!darkMode)}
            title={darkMode ? "Light Mode" : "Dark Mode"}
          >
            <span className="side-icon">
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </span>

            <span className="side-name">
              {darkMode ? "Light Mode" : "Dark Mode"}
            </span>
          </button>

          {/* Help */}

          <button className="side-bottom-btn" onClick={() => handleMenuClick("Messages")} title="Open booking messages">
            <span className="side-icon">
              <MessageSquare size={20} />
            </span>

              <span className="side-name">Help</span>
          </button>

          <button
            className="side-bottom-btn"
            onClick={logout}
            title="Sign out"
            aria-label="Sign out"
          >
            <span className="side-icon"><LogOut size={20} /></span>
            <span className="side-name">Sign out</span>
          </button>

          {/* User */}

          <div className="sidebar-user">
            <div className="sidebar-user-avatar">{(user.name || "U").charAt(0).toUpperCase()}</div>

            <div className="sidebar-user-info">
              <strong>{user.name}</strong>
              <span>{user.role}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* ================= MAIN AREA ================= */}

      <div className="main-area">
        {/* ================= TOPBAR ================= */}

        <header className="topbar">
          <div className="topbar-left">
            <div className="breadcrumb">
              <span>HomeHive</span>

              <span className="breadcrumb-slash">/</span>

              <strong>{activeMenu}</strong>
            </div>
          </div>

          <div className="topbar-right">
            {/* Search */}

            <div className="search-box">
              <Search size={18} />

              <input
                type="text"
                placeholder="Search services..."
                aria-label="Search services"
                value={serviceSearchTerm}
                onChange={(event) => setServiceSearchTerm(event.target.value)}
                onFocus={() => handleMenuClick("Services")}
              />
            </div>

            {/* Location */}

            <button className="location-box" onClick={() => setShowLocationModal(true)}>
              <MapPin size={18} />

              <span>{selectedLocation?.city || "Service area"}</span>

              <ChevronDown size={15} />
            </button>

            {/* Notification */}

            <button className="notification-button" aria-label="Notifications" onClick={() => handleMenuClick("Notifications")}>
              <Bell size={20} />

              {notificationCount > 0 && <span>{notificationCount}</span>}
            </button>

            {/* Profile */}

            <button className="top-profile" aria-label="Open profile" onClick={() => handleMenuClick("Profile")}>
              <div className="top-profile-avatar">{(user.name || "U").charAt(0).toUpperCase()}</div>

              <div className="top-profile-text">
                <strong>{user.name}</strong>
                <span>{user.role}</span>
              </div>

              <ChevronDown size={15} />
            </button>
          </div>
        </header>

        {/* ================= DASHBOARD ================= */}

        <main className="dashboard">
          {activeMenu === "Dashboard" && dashboardError && <p className="workspace-alert" role="alert">Some dashboard details could not be loaded: {dashboardError}</p>}
          {activeMenu === "Services" ? <ServicesPage user={user} initialCategory={serviceCategory} searchTerm={serviceSearchTerm} selectedLocation={selectedLocation} onOpenLocation={() => setShowLocationModal(true)} /> : activeMenu === "Service Passport" ? <PassportPage /> : activeMenu === "Bookings" ? <BookingsPage user={user} /> : activeMenu === "Messages" ? <MessagesPage user={user} /> : activeMenu === "Notifications" ? <NotificationsPage /> : activeMenu === "Profile" ? <ProfilePage /> : activeMenu === "Settings" ? <SettingsPage darkMode={darkMode} setDarkMode={setDarkMode} /> : activeMenu === "Billing" ? <BillingPage user={user} /> : activeMenu === "Provider Profile" && user.role === "provider" ? <ProviderPage /> : activeMenu === "Admin" && user.role === "admin" ? <AdminPage /> : <>
          {/* Hero */}

          <section className="hero-section">
            <div className="hero-content">
              <span className="hero-label">
                HOMEHIVE DASHBOARD
              </span>

              <h1>
                Welcome to your{" "}
                <span>HomeHive</span> 👋
              </h1>

              <p>
                Manage your home services, appliances and
                maintenance history from one place.
              </p>
            </div>

            <button className="book-service-btn" onClick={() => user.role === "customer" ? openServices() : handleMenuClick(user.role === "provider" ? "Bookings" : "Admin")}>
              <Plus size={19} />

              <span>{user.role === "customer" ? "Book a Service" : user.role === "provider" ? "Manage Bookings" : "Open Admin"}</span>
            </button>
          </section>

          {/* ================= STATS ================= */}

          <section className="stats-grid">
            {/* Total Services */}

            <div className="stat-card">
              <div className="stat-icon">
                <Wrench size={22} />
              </div>

              <div className="stat-content">
                <span>{user.role === "admin" ? "Users" : "Total Bookings"}</span>

                <strong>{user.role === "admin" ? dashboardData.adminStats?.totalUsers ?? "—" : dashboardData.bookings.length}</strong>

                <small>{user.role === "admin" ? "Registered customers" : "Service requests"}</small>
              </div>
            </div>

            {/* Completed */}

            <div className="stat-card">
              <div className="stat-icon">
                <Check size={22} />
              </div>

              <div className="stat-content">
                <span>{user.role === "admin" ? "Providers" : "Completed"}</span>

                <strong>{user.role === "admin" ? dashboardData.adminStats?.totalProviders ?? "—" : completedBookings}</strong>

                <small>{user.role === "admin" ? "Active provider profiles" : "Successfully completed"}</small>
              </div>
            </div>

            {/* Upcoming */}

            <div className="stat-card">
              <div className="stat-icon">
                <Clock3 size={22} />
              </div>

              <div className="stat-content">
                <span>{user.role === "admin" ? "Pending bookings" : "Upcoming"}</span>

                <strong>{user.role === "admin" ? dashboardData.adminStats?.pendingBookings ?? "—" : upcomingBookings}</strong>

                <small>{user.role === "admin" ? "Awaiting provider action" : "Awaiting service"}</small>
              </div>
            </div>

            {/* Rating */}

            <div className="stat-card">
              <div className="stat-icon">
                <Star size={22} />
              </div>

              <div className="stat-content">
                <span>{user.role === "provider" ? "Provider Rating" : user.role === "admin" ? "Service types" : "Appliances"}</span>

                <strong>{user.role === "provider" ? dashboardData.provider?.rating?.toFixed?.(1) ?? "—" : user.role === "admin" ? dashboardData.adminStats?.totalServices ?? "—" : dashboardData.assets.length}</strong>

                <small>{user.role === "provider" ? `${dashboardData.provider?.totalReviews || 0} customer reviews` : "In your passport"}</small>
              </div>
            </div>
          </section>

          {user.role !== "admin" && <section className="section-block recent-bookings">
            <div className="section-heading">
              <div><h2>Recent bookings</h2><p>Your latest service requests</p></div>
              <button className="view-all-btn" onClick={() => handleMenuClick("Bookings")}>View bookings <ArrowUpRight size={16} /></button>
            </div>
            {!dashboardData.bookings.length ? <p className="workspace-muted">No bookings yet. Choose a service to get started.</p> : dashboardData.bookings.slice(0, 3).map((booking) => <button className="dashboard-booking-row" key={booking._id} onClick={() => handleMenuClick("Bookings")}>
              <span><strong>{booking.service?.name || "Home service"}</strong><small>{booking.provider?.businessName || booking.appliance?.name || "Service request"}</small></span>
              <span>{booking.date ? new Date(booking.date).toLocaleDateString() : "Date pending"}</span>
              <span className={`booking-status status-${booking.status}`}>{booking.status.replaceAll("_", " ")}</span>
            </button>)}
          </section>}

          {/* ================= QUICK SERVICES ================= */}

          <section className="section-block">
            <div className="section-heading">
              <div>
                <h2>Quick Services</h2>

                <p>Choose a service for your home</p>
              </div>

              <button className="view-all-btn" onClick={() => openServices()}>
                View All
                <ArrowUpRight size={17} />
              </button>
            </div>

            <div className="quick-services-grid">
              {quickServices.map((service) => {
                const Icon = service.icon;

                return (
                  <button
                    className="quick-service-card"
                    key={service.title}
                    onClick={() => openServices(service.title)}
                  >
                    <div className="quick-service-icon">
                      <Icon size={21} />
                    </div>

                    <div className="quick-service-content">
                      <strong>{service.title}</strong>

                      <span>{service.subtitle}</span>
                    </div>

                    <ArrowUpRight
                      className="quick-arrow"
                      size={18}
                    />
                  </button>
                );
              })}
            </div>
          </section>

          {/* ================= LOWER CONTENT ================= */}

          {user.role === "customer" && <section className="lower-section">
            {/* Maintenance Reminder */}

            <div className="maintenance-card">
              <div className="maintenance-top">
                <div>
                  <span className="card-label">
                    MAINTENANCE REMINDER
                  </span>

                  <h2>{nextDueAsset ? `${nextDueAsset.name} Service Due` : "No Upcoming Maintenance"}</h2>
                </div>

                <div className="maintenance-small-icon">
                  <Snowflake size={22} />
                </div>
              </div>

              <div className="appliance-row">
                <div className="appliance-icon">
                  <Snowflake size={23} />
                </div>

                <div>
                  <strong>{nextDueAsset ? [nextDueAsset.brand, nextDueAsset.model, nextDueAsset.name].filter(Boolean).join(" ") : "Add service dates to your appliances"}</strong>

                  <span>
                    Last service: {nextDueAsset?.lastServiceDate ? new Date(nextDueAsset.lastServiceDate).toLocaleDateString() : "Not recorded"}
                  </span>
                </div>
              </div>

              <div className="service-progress">
                <small>{nextDueAsset?.nextServiceDate ? `Next service due ${new Date(nextDueAsset.nextServiceDate).toLocaleDateString()}` : "Next service dates appear here when set in your passport."}</small>
              </div>

              <button className="schedule-btn" onClick={() => openServices()}>
                Schedule Service
              </button>
            </div>

            {/* Digital Passport */}

            <div className="passport-card">
              <div className="passport-icon">
                <ShieldCheck size={26} />
              </div>

              <span className="passport-label">
                DIGITAL RECORD
              </span>

              <h2>Digital Home Service Passport</h2>

              <p>
                Keep your complete home and appliance service
                history in one secure place.
              </p>

              <div className="passport-features">
                <div>
                  <Check size={15} />
                  <span>Service History</span>
                </div>

                <div>
                  <Check size={15} />
                  <span>Parts Replaced</span>
                </div>

                <div>
                  <Check size={15} />
                  <span>Warranty Details</span>
                </div>

                <div>
                  <Check size={15} />
                  <span>Maintenance Reminders</span>
                </div>
              </div>

              <button className="passport-btn" onClick={() => handleMenuClick("Service Passport")}>
                View Service Passport
                <ArrowUpRight size={16} />
              </button>
            </div>
          </section>}
          </>}
        </main>
      </div>

      {showLocationModal && (
        <LocationModal
          selectedLocation={selectedLocation}
          onSelect={handleSelectLocation}
          onClose={() => setShowLocationModal(false)}
        />
      )}
    </div>
  );
}

export default App;