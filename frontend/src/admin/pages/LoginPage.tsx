import { useMemo, useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import { toast } from "../../lib/toast"

type LoginPageProps = {
  onLoginSuccess: (params: { username: string; role: string; token: string; fullName?: string; office?: string }) => void
}

const RAW_API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000/api"
const API_URL = RAW_API_URL.replace(/\/$/, "").endsWith("/api")
  ? RAW_API_URL.replace(/\/$/, "")
  : `${RAW_API_URL.replace(/\/$/, "")}/api`

export default function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [keepMeSignedIn, setKeepMeSignedIn] = useState(true)

  const canSubmit = useMemo(() => username.trim().length > 0 && password.length > 0, [username, password])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.message || "Login failed.")
        toast.error(data.message || "Login failed.")
        return
      }
      const storage = keepMeSignedIn ? localStorage : sessionStorage
      storage.setItem("token", data.token)
      storage.setItem("user", JSON.stringify(data.user))
      onLoginSuccess({
        username: data.user.username,
        role: data.user.role,
        token: data.token,
        fullName: data.user.fullName,
        office: data.user.office,
      })
      toast.success("Login successful.")
      setPassword("")
    } catch {
      setError("Login failed. Please try again.")
      toast.error("Login failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,400&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .lp-root {
          font-family: 'Inter', sans-serif;
          min-height: 100dvh;
          display: flex;
          background: #f0f9ff;
        }

        /* ══════════════════════════════════════
           LEFT PANEL — background image + light blue overlay
        ══════════════════════════════════════ */
        .lp-left {
          position: relative;
          width: 55%;
          display: flex;
          flex-direction: column;
          justify-content: center;
          overflow: hidden;
          background: #0369a1;
        }

        /* Background photo */
        .lp-bg {
          position: absolute;
          inset: 0;
          background-image: url('/images/background.jpg');
          background-size: cover;
          background-position: center 30%;
          transform: scale(1.03);
          transition: transform 8s ease-out;
        }

        /* Light-blue tinted gradient overlay — preserves image but tints to theme */
        .lp-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            160deg,
            rgba(2, 132, 199, 0.72) 0%,
            rgba(3, 105, 161, 0.80) 50%,
            rgba(12, 74, 110, 0.92) 100%
          );
        }

        /* Dot grid pattern on top */
        .lp-dots {
          position: absolute;
          inset: 0;
          background-image: radial-gradient(circle, rgba(255,255,255,0.12) 1.5px, transparent 1.5px);
          background-size: 28px 28px;
          pointer-events: none;
        }

        .lp-left-content {
          position: relative;
          z-index: 2;
          padding: 3.5rem 3rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 0;
        }

        /* Seal — centered, larger */
        .lp-seal-row {
          display: flex;
          justify-content: center;
          margin-bottom: 2rem;
        }
        .lp-seal {
          width: 96px;
          height: 96px;
          border-radius: 50%;
          background: rgba(255,255,255,0.22);
          backdrop-filter: blur(12px);
          border: 3px solid rgba(255,255,255,0.55);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          padding: 7px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.18);
        }
        .lp-seal img { width: 100%; height: 100%; object-fit: contain; }

        .lp-tag {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 6px 16px 6px 10px;
          border-radius: 999px;
          background: rgba(255,255,255,0.2);
          border: 1px solid rgba(255,255,255,0.35);
          margin-bottom: 1.5rem;
          width: fit-content;
          backdrop-filter: blur(8px);
        }
        .lp-tag-dot {
          width: 7px; height: 7px;
          border-radius: 50%;
          background: #bae6fd;
          animation: pulse-lp 2s infinite;
        }
        @keyframes pulse-lp {
          0%,100% { opacity: 1; box-shadow: 0 0 0 0 rgba(186,230,253,0.6); }
          50% { opacity: 0.75; box-shadow: 0 0 0 5px rgba(186,230,253,0); }
        }
        .lp-tag-text {
          font-size: 0.68rem;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #e0f2fe;
        }

        .lp-title {
          font-size: clamp(3rem, 5vw, 5.5rem);
          font-weight: 900;
          line-height: 1.05;
          color: #ffffff;
          letter-spacing: -0.04em;
          margin-bottom: 1.25rem;
          text-align: center;
        }
        .lp-title em {
          font-style: normal;
          background: linear-gradient(90deg, #bae6fd, #e0f2fe);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .lp-desc {
          font-size: 1.05rem;
          color: rgba(255,255,255,0.78);
          line-height: 1.75;
          max-width: 480px;
          margin-bottom: 2.25rem;
          font-weight: 400;
          text-align: center;
        }

        /* Stat chips */
        .lp-stats {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
        }
        .lp-stat {
          background: rgba(255,255,255,0.15);
          border: 1px solid rgba(255,255,255,0.25);
          backdrop-filter: blur(12px);
          border-radius: 14px;
          padding: 0.8rem 1.2rem;
          display: flex;
          align-items: center;
          gap: 12px;
          transition: background 0.2s, transform 0.2s;
        }
        .lp-stat:hover {
          background: rgba(255,255,255,0.22);
          transform: translateY(-2px);
        }
        .lp-stat-icon {
          width: 36px; height: 36px;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .lp-stat-icon svg { width: 16px; height: 16px; color: white; }
        .lp-stat-label { font-size: 0.66rem; color: rgba(255,255,255,0.55); margin-bottom: 2px; letter-spacing: 0.04em; text-transform: uppercase; }
        .lp-stat-value { font-size: 0.84rem; font-weight: 700; color: #ffffff; }

        /* Feature list */
        .lp-features {
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
          align-items: center;
        }
        .lp-feature {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 0.82rem;
          color: rgba(255,255,255,0.85);
          font-weight: 500;
        }
        .lp-feature-check {
          width: 20px; height: 20px;
          border-radius: 50%;
          background: rgba(255,255,255,0.2);
          border: 1px solid rgba(255,255,255,0.35);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .lp-feature-check svg { width: 10px; height: 10px; color: #bae6fd; }

        /* ══════════════════════════════════════
           RIGHT PANEL — white card
        ══════════════════════════════════════ */
        .lp-right {
          width: 45%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #ffffff;
          padding: 2.5rem 2.5rem;
          position: relative;
          overflow: hidden;
        }

        /* Subtle bg decoration on right */
        .lp-right-bg {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 600px 400px at 110% 110%, rgba(14,165,233,0.06) 0%, transparent 70%),
            radial-gradient(ellipse 400px 300px at -10% -10%, rgba(186,230,253,0.1) 0%, transparent 70%);
          pointer-events: none;
        }

        .lp-card {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 400px;
        }

        /* Logo mark on form */
        .lp-form-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 1.75rem;
        }
        .lp-form-logo-icon {
          width: 44px; height: 44px;
          border-radius: 12px;
          background: linear-gradient(135deg, #0ea5e9, #0369a1);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 12px rgba(14,165,233,0.35);
          flex-shrink: 0;
          overflow: hidden;
          padding: 4px;
        }
        .lp-form-logo-icon img { width: 100%; height: 100%; object-fit: contain; }
        .lp-form-logo-text { font-size: 0.78rem; font-weight: 700; color: #0c4a6e; line-height: 1.3; }
        .lp-form-logo-sub { font-size: 0.66rem; color: #7dd3fc; font-weight: 500; }

        .lp-form-eyebrow {
          font-size: 0.66rem;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #0ea5e9;
          margin-bottom: 0.4rem;
        }
        .lp-form-title {
          font-size: 1.9rem;
          font-weight: 800;
          color: #0c4a6e;
          letter-spacing: -0.035em;
          margin-bottom: 0.4rem;
          line-height: 1.15;
        }
        .lp-form-sub {
          font-size: 0.8rem;
          color: #64748b;
          line-height: 1.65;
          margin-bottom: 2rem;
        }

        /* Divider */
        .lp-divider {
          height: 1px;
          background: linear-gradient(to right, transparent, #bae6fd, transparent);
          margin-bottom: 1.75rem;
        }

        /* Fields */
        .lp-field { margin-bottom: 1.1rem; }
        .lp-field-label {
          display: block;
          font-size: 0.7rem;
          font-weight: 600;
          color: #0369a1;
          letter-spacing: 0.07em;
          text-transform: uppercase;
          margin-bottom: 7px;
        }
        .lp-input-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }
        .lp-input-icon {
          position: absolute;
          left: 14px;
          width: 15px; height: 15px;
          color: #93c5fd;
          pointer-events: none;
          flex-shrink: 0;
          transition: color 0.2s;
        }
        .lp-input {
          width: 100%;
          height: 50px;
          padding: 0 44px 0 44px;
          border-radius: 12px;
          border: 1.5px solid #bae6fd;
          background: #f0f9ff;
          font-family: 'Inter', sans-serif;
          font-size: 0.875rem;
          color: #0c4a6e;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
        }
        .lp-input::placeholder { color: #93c5fd; }
        .lp-input:focus {
          border-color: #0ea5e9;
          background: #ffffff;
          box-shadow: 0 0 0 4px rgba(14,165,233,0.12);
        }
        .lp-input-wrap:focus-within .lp-input-icon { color: #0ea5e9; }
        .lp-input.err {
          border-color: #f87171;
          background: #fff5f5;
          box-shadow: 0 0 0 4px rgba(248,113,113,0.1);
        }

        .lp-pw-toggle {
          position: absolute;
          right: 12px;
          background: none;
          border: none;
          cursor: pointer;
          color: #93c5fd;
          padding: 6px;
          border-radius: 8px;
          display: flex; align-items: center;
          transition: color 0.2s, background 0.2s;
          line-height: 0;
        }
        .lp-pw-toggle:hover { color: #0ea5e9; background: rgba(14,165,233,0.08); }
        .lp-pw-toggle svg { width: 15px; height: 15px; }

        /* Error */
        .lp-error {
          display: flex;
          align-items: flex-start;
          gap: 9px;
          background: #fff5f5;
          border: 1px solid #fecaca;
          border-radius: 10px;
          padding: 11px 14px;
          margin-bottom: 1rem;
          font-size: 0.78rem;
          color: #dc2626;
          font-weight: 500;
          line-height: 1.5;
        }
        .lp-error-icon { flex-shrink: 0; margin-top: 1px; }

        /* Row */
        .lp-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin: 1.25rem 0 1.75rem;
        }
        .lp-remember {
          display: flex; align-items: center; gap: 9px;
          background: none; border: none; cursor: pointer; padding: 0;
        }
        .lp-checkbox {
          width: 18px; height: 18px;
          border-radius: 5px;
          border: 1.5px solid #bae6fd;
          background: white;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.15s;
          flex-shrink: 0;
        }
        .lp-checkbox.on {
          background: #0ea5e9;
          border-color: #0ea5e9;
          box-shadow: 0 2px 8px rgba(14,165,233,0.35);
        }
        .lp-checkbox svg { width: 10px; height: 10px; color: white; }
        .lp-remember-label {
          font-size: 0.78rem;
          font-weight: 500;
          color: #475569;
        }

        /* Button */
        .lp-btn {
          width: 100%;
          height: 52px;
          border: none;
          border-radius: 14px;
          background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 50%, #0369a1 100%);
          color: white;
          font-family: 'Inter', sans-serif;
          font-size: 0.82rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          box-shadow: 0 4px 20px rgba(14,165,233,0.45), 0 1px 4px rgba(14,165,233,0.2);
          transition: transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s;
          position: relative;
          overflow: hidden;
        }
        .lp-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(255,255,255,0.14) 0%, transparent 60%);
          border-radius: inherit;
        }
        .lp-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 32px rgba(14,165,233,0.55), 0 2px 10px rgba(14,165,233,0.3);
        }
        .lp-btn:active:not(:disabled) { transform: translateY(0); }
        .lp-btn:disabled { opacity: 0.45; cursor: not-allowed; box-shadow: none; }

        .lp-spinner {
          width: 16px; height: 16px;
          border: 2px solid rgba(255,255,255,0.35);
          border-top-color: white;
          border-radius: 50%;
          animation: lp-spin 0.65s linear infinite;
        }
        @keyframes lp-spin { to { transform: rotate(360deg); } }

        /* Footer */
        .lp-card-footer {
          text-align: center;
          margin-top: 2rem;
          font-size: 0.7rem;
          color: #94a3b8;
          line-height: 1.6;
        }
        .lp-card-footer span { color: #0ea5e9; }

        /* Security badge */
        .lp-secure-badge {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          margin-top: 1rem;
          font-size: 0.68rem;
          color: #94a3b8;
          font-weight: 500;
        }
        .lp-secure-badge svg { width: 12px; height: 12px; color: #10b981; }

        /* Responsive */
        @media (max-width: 860px) {
          .lp-root { flex-direction: column; }
          .lp-left { width: 100%; min-height: 50vh; justify-content: flex-end; }
          .lp-right { width: 100%; padding: 2.5rem 1.25rem 3rem; }
          .lp-card { padding: 2rem 1.5rem; }
        }
      `}</style>

      <div className="lp-root">

        {/* ── LEFT PANEL — background image + light blue overlay ── */}
        <div className="lp-left">
          <div className="lp-bg" />
          <div className="lp-overlay" />
          <div className="lp-dots" />

          <div className="lp-left-content">
            {/* Seal — centered */}
            <div className="lp-seal-row">
              <div className="lp-seal">
                <img src="/images/Bataan.png" alt="Bataan Seal" />
              </div>
            </div>

            {/* Heading */}
            <h1 className="lp-title">
              Document<br />
              <em>Tracking System</em>
            </h1>

            <p className="lp-desc">
              Secure, fast, and organized document management platform for the Capitol. Monitor requests and manage workflow efficiently.
            </p>

            {/* Feature list */}
            <div className="lp-features">
              {[
                "Real-time document status tracking",
                "Multi-office workflow management",
                "Enterprise-grade security & audit logs",
                "Instant approvals and notifications",
              ].map((f) => (
                <div className="lp-feature" key={f}>
                  <div className="lp-feature-check">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  {f}
                </div>
              ))}
            </div>

          </div>
        </div>

        {/* ── RIGHT PANEL — pure white ── */}
        <div className="lp-right">
          <div className="lp-right-bg" />
          <div className="lp-card">

            <h2 className="lp-form-title" style={{ marginBottom: "1.75rem" }}>Sign In</h2>

            <form onSubmit={onSubmit}>
              {/* Username */}
              <div className="lp-field">
                <label className="lp-field-label" htmlFor="username">Username</label>
                <div className="lp-input-wrap">
                  <svg className="lp-input-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <input
                    id="username"
                    name="username"
                    autoComplete="username"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className={`lp-input${error ? " err" : ""}`}
                    placeholder="Enter your username"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="lp-field">
                <label className="lp-field-label" htmlFor="password">Password</label>
                <div className="lp-input-wrap">
                  <svg className="lp-input-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`lp-input${error ? " err" : ""}`}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    className="lp-pw-toggle"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff /> : <Eye />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="lp-error">
                  <svg className="lp-error-icon" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {error}
                </div>
              )}

              {/* Remember row */}
              <div className="lp-row">
                <button
                  type="button"
                  className="lp-remember"
                  onClick={() => setKeepMeSignedIn(!keepMeSignedIn)}
                  aria-pressed={keepMeSignedIn}
                >
                  <div className={`lp-checkbox${keepMeSignedIn ? " on" : ""}`}>
                    {keepMeSignedIn && (
                      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className="lp-remember-label">Keep me signed in</span>
                </button>
              </div>

              <button
                id="login-submit-btn"
                type="submit"
                className="lp-btn"
                disabled={!canSubmit || loading}
              >
                {loading ? (
                  <>
                    <span className="lp-spinner" />
                    Authenticating…
                  </>
                ) : (
                  <>
                    Sign In
                    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </button>
            </form>

            <div className="lp-card-footer">
              © {new Date().getFullYear()} <span>Province of Bataan</span> &nbsp;·&nbsp; All rights reserved
            </div>

            <div className="lp-secure-badge">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Secured with end-to-end encryption
            </div>
          </div>
        </div>

      </div>
    </>
  )
}
