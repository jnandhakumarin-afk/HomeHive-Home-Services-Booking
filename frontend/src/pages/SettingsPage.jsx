import { Moon, Sun } from "lucide-react";

export default function SettingsPage({ darkMode, setDarkMode }) {
  return <section className="workspace-page">
    <header className="workspace-page-heading"><div><p className="hero-label">HOMEHIVE</p><h1>Settings</h1><p>Manage display preferences for this browser session.</p></div><Sun size={22} /></header>
    <section className="workspace-section settings-panel">
      <div><h2>Appearance</h2><p>Choose the dashboard theme.</p></div>
      <div className="settings-theme-switch" role="group" aria-label="Dashboard theme">
        <button type="button" className={!darkMode ? "active" : ""} aria-pressed={!darkMode} onClick={() => setDarkMode(false)}><Sun size={17} /> Light</button>
        <button type="button" className={darkMode ? "active" : ""} aria-pressed={darkMode} onClick={() => setDarkMode(true)}><Moon size={17} /> Dark</button>
      </div>
      <p className="workspace-muted">Theme preference is stored for the current app session.</p>
    </section>
  </section>;
}
