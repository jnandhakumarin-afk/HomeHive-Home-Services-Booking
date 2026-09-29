import { useState } from "react";
import { Home, LoaderCircle, ShieldCheck } from "lucide-react";

export default function AuthPanel({ onLogin, onRegister }) {
  const [mode, setMode] = useState("login");
  const [role, setRole] = useState("customer");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(() => {
    const message = sessionStorage.getItem("homehive-auth-message") || "";
    sessionStorage.removeItem("homehive-auth-message");
    return message;
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isRegistering = mode === "register";

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");
    setIsSubmitting(true);

    try {
      if (isRegistering) {
        await onRegister({ name, email, password, phone, role });
      } else {
        await onLogin({ email, password });
      }
    } catch (requestError) {
      setError(requestError.message || "Unable to sign in. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="app light-mode auth-app">
      <section className="auth-screen">
        <div className="auth-brand">
          <span className="auth-brand-mark"><Home size={22} /></span>
          <span>HomeHive</span>
        </div>

        <form className="auth-panel" onSubmit={submit}>
          <div className="auth-heading-icon"><ShieldCheck size={22} /></div>
          <p className="auth-kicker">HOME SERVICES, IN ONE PLACE</p>
          <h1>{isRegistering ? "Create your account" : "Welcome back"}</h1>
          <p className="auth-description">
            {isRegistering ? "Start managing your home services." : "Sign in to continue to your home dashboard."}
          </p>

          <div className="auth-mode-switch" role="tablist" aria-label="Account access">
            <button type="button" role="tab" aria-selected={!isRegistering} onClick={() => { setMode("login"); setError(""); }}>
              Sign in
            </button>
            <button type="button" role="tab" aria-selected={isRegistering} onClick={() => { setMode("register"); setError(""); }}>
              Register
            </button>
          </div>

          {isRegistering && (
            <>
              <div className="auth-role-switch" role="group" aria-label="Account type">
                <button type="button" className={role === "customer" ? "active" : ""} onClick={() => setRole("customer")}>
                  Customer
                </button>
                <button type="button" className={role === "provider" ? "active" : ""} onClick={() => setRole("provider")}>
                  Provider
                </button>
              </div>
              <label className="auth-field">
                <span>Full name</span>
                <input autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} required />
              </label>
            </>
          )}

          <label className="auth-field">
            <span>Email address</span>
            <input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>

          {isRegistering && (
            <label className="auth-field">
              <span>Phone <small>Optional</small></span>
              <input type="tel" autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} />
            </label>
          )}

          <label className="auth-field">
            <span>Password</span>
            <input type="password" autoComplete={isRegistering ? "new-password" : "current-password"} minLength={isRegistering ? 6 : undefined} value={password} onChange={(event) => setPassword(event.target.value)} required />
          </label>

          {error && <p className="auth-error" role="alert">{error}</p>}
          {notice && <p className="auth-notice" role="status">{notice}</p>}

          <button className="auth-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting && <LoaderCircle className="auth-spinner" size={17} />}
            {isSubmitting ? "Please wait" : isRegistering ? "Create account" : "Sign in"}
          </button>
          <p className="auth-footnote">Your password is sent only to HomeHive for secure verification.</p>
        </form>
      </section>
    </main>
  );
}
