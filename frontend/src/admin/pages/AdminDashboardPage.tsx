import {
  Building2,
  BarChart3,
  FileCheck2,
  Files,
  LayoutDashboard,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
} from "lucide-react"
import { useEffect, useState } from "react"
import ApprovalsPage from "./ApprovalsPage"
import AllDocumentsPage from "./AllDocumentsPage"
import OfficesPage from "./OfficesPage"
import ReportsPage from "./ReportsPage"
import SettingsPage from "./SettingsPage"
import API_URL, { apiFetch } from "../../lib/apiFetch"

type OfficeSummary = {
  name: string
  inTransit: number
  onProcess: number
  ongoing: number
  accomplished: number
  discontinued: number
  exceeded: number
}

type DashboardStats = {
  ongoing: number
  accomplished: number
  discontinued: number
  exceeded: number
  officeSummary: OfficeSummary[]
}

type AdminDashboardPageProps = {
  onLogout: () => void
}

type SystemAdminRoute =
  | "dashboard"
  | "approvals"
  | "all-documents"
  | "offices"
  | "reports"
  | "settings"

export default function AdminDashboardPage({ onLogout }: AdminDashboardPageProps) {
  const [route, setRoute] = useState<SystemAdminRoute>("dashboard")
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [showTable, setShowTable] = useState(false)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await apiFetch(`${API_URL}/documents/stats`)
        if (res.ok) {
          const data = await res.json()
          setStats(data)
        }
      } catch (err) {
        console.error("Failed to fetch stats:", err)
      } finally {
        setStatsLoading(false)
      }
    }
    fetchStats()
  }, [])

  const mobileRouteLabel =
    route === "dashboard"
      ? "Dashboard"
      : route === "approvals"
        ? "Approvals"
        : route === "all-documents"
          ? "All Documents"
          : route === "offices"
            ? "Offices"
            : route === "reports"
              ? "Reports"
              : "Settings"

  function navClass(isActive: boolean) {
    return isActive
      ? "group flex w-full items-center gap-2 rounded-md bg-slate-100 px-3 py-2 text-sm font-medium text-slate-900 focus:outline-none focus-visible:outline-none"
      : "group flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus-visible:outline-none"
  }

  function navButtonClass(isActive: boolean) {
    const base = navClass(isActive)
    return isSidebarCollapsed ? `${base} justify-center px-2` : base
  }

  return (
    <div style={{ minHeight: "100dvh", background: "#f0f9ff", fontFamily: "Inter, sans-serif" }}>
      <div
        style={{
          display: "grid",
          minHeight: "100dvh",
          gridTemplateColumns: isSidebarCollapsed ? "80px 1fr" : "260px 1fr",
        }}
        className="lg:grid"
      >
        <aside
          className="hidden lg:block"
          style={{
            background: "#ffffff",
            borderRight: "1px solid #bae6fd",
            boxShadow: "2px 0 16px rgba(14,165,233,0.07)",
          }}
        >
          <div style={{ display: "flex", height: "100dvh", flexDirection: "column" }}>

            {/* ── Header ── */}
            <div
              style={{
                background: "linear-gradient(135deg, #0ea5e9 0%, #0284c7 60%, #0369a1 100%)",
                padding: isSidebarCollapsed ? "1.25rem 0" : "1.25rem 1.25rem",
                display: "flex",
                alignItems: "center",
                justifyContent: isSidebarCollapsed ? "center" : "flex-start",
                gap: "12px",
                flexShrink: 0,
                minHeight: "72px",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div style={{
                position: "absolute", inset: 0,
                backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px)",
                backgroundSize: "20px 20px",
                pointerEvents: "none",
              }} />
              <div style={{
                width: isSidebarCollapsed ? "38px" : "44px",
                height: isSidebarCollapsed ? "38px" : "44px",
                borderRadius: "50%",
                background: "rgba(255,255,255,0.22)",
                border: "2px solid rgba(255,255,255,0.5)",
                display: "flex", alignItems: "center", justifyContent: "center",
                overflow: "hidden", padding: "4px", flexShrink: 0,
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                position: "relative",
              }}>
                <img src="/images/Bataan.png" alt="Bataan" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
              </div>
              {!isSidebarCollapsed && (
                <div style={{ minWidth: 0, position: "relative" }}>
                  <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#ffffff", letterSpacing: "0.01em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    Bataan Capitol DTS
                  </div>
                  <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.7)", fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                    System Admin
                  </div>
                </div>
              )}
            </div>

            {/* ── Nav ── */}
            <nav style={{ flex: 1, padding: "0.75rem 0.625rem", display: "flex", flexDirection: "column", gap: "2px", overflowY: "auto" }}>
              {[
                { key: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={16} /> },
                { key: "approvals", label: "Approvals", icon: <FileCheck2 size={16} /> },
                { key: "all-documents", label: "All Documents", icon: <Files size={16} /> },
                { key: "offices", label: "Offices", icon: <Building2 size={16} /> },
                { key: "reports", label: "Reports", icon: <BarChart3 size={16} /> },
                { key: "settings", label: "Settings", icon: <Settings size={16} /> },
              ].map(({ key, label, icon }) => {
                const isActive = route === key
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setRoute(key as SystemAdminRoute)}
                    title={label}
                    style={{
                      display: "flex", alignItems: "center", gap: "10px",
                      width: "100%",
                      padding: isSidebarCollapsed ? "0.6rem 0" : "0.6rem 0.85rem",
                      justifyContent: isSidebarCollapsed ? "center" : "flex-start",
                      borderRadius: "10px", border: "none", cursor: "pointer",
                      fontFamily: "inherit", fontSize: "0.82rem",
                      fontWeight: isActive ? 600 : 500,
                      color: isActive ? "#0284c7" : "#475569",
                      background: isActive ? "linear-gradient(to right, #e0f2fe, #f0f9ff)" : "transparent",
                      boxShadow: isActive ? "inset 3px 0 0 #0ea5e9" : "none",
                      transition: "all 0.15s ease", outline: "none",
                    }}
                    onMouseEnter={e => { if (!isActive) { (e.currentTarget as HTMLButtonElement).style.background = "#f0f9ff"; (e.currentTarget as HTMLButtonElement).style.color = "#0284c7" } }}
                    onMouseLeave={e => { if (!isActive) { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = "#475569" } }}
                  >
                    <span style={{ color: isActive ? "#0ea5e9" : "#94a3b8", flexShrink: 0, display: "flex" }}>{icon}</span>
                    {!isSidebarCollapsed && label}
                  </button>
                )
              })}
            </nav>

            {/* ── Footer ── */}
            <div style={{ borderTop: "1px solid #bae6fd", padding: "0.75rem 0.625rem", display: "flex", flexDirection: "column", gap: "6px" }}>
              <button type="button" onClick={() => setIsSidebarCollapsed(v => !v)}
                title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: isSidebarCollapsed ? "center" : "flex-start", width: "100%", padding: isSidebarCollapsed ? "0.55rem 0" : "0.55rem 0.85rem", borderRadius: "10px", border: "1.5px solid #bae6fd", background: "#f0f9ff", cursor: "pointer", fontSize: "0.78rem", fontWeight: 500, color: "#0369a1", fontFamily: "inherit", transition: "all 0.15s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "#e0f2fe" }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "#f0f9ff" }}
              >
                {isSidebarCollapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
                {!isSidebarCollapsed && "Collapse sidebar"}
              </button>
              <button type="button" onClick={onLogout} title="Logout"
                style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: isSidebarCollapsed ? "center" : "flex-start", width: "100%", padding: isSidebarCollapsed ? "0.55rem 0" : "0.55rem 0.85rem", borderRadius: "10px", border: "1.5px solid #fecaca", background: "#fff5f5", cursor: "pointer", fontSize: "0.78rem", fontWeight: 500, color: "#dc2626", fontFamily: "inherit", transition: "all 0.15s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "#fee2e2" }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "#fff5f5" }}
              >
                <LogOut size={15} />
                {!isSidebarCollapsed && "Logout"}
              </button>
            </div>
          </div>
        </aside>

        {/* ══ MAIN ══ */}
        <main style={{ minWidth: 0, height: "100dvh", overflowY: "auto", background: "#f0f9ff" }}>

          {/* Mobile header */}
          <div className="lg:hidden">
            <header style={{ position: "sticky", top: 0, zIndex: 10, background: "linear-gradient(135deg,#0ea5e9,#0284c7)", borderBottom: "1px solid #0284c7", backdropFilter: "blur(8px)" }}>
              <div style={{ display: "flex", height: "64px", width: "100%", alignItems: "center", justifyContent: "space-between", gap: "1rem", padding: "0 1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "rgba(255,255,255,0.2)", border: "2px solid rgba(255,255,255,0.45)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", padding: "3px", flexShrink: 0 }}>
                    <img src="/images/Bataan.png" alt="Bataan" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Bataan Capitol DTS</div>
                    <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>{mobileRouteLabel}</div>
                  </div>
                </div>
                <button onClick={onLogout} type="button"
                  style={{ display: "flex", alignItems: "center", gap: "6px", padding: "0.4rem 0.85rem", borderRadius: "8px", border: "1.5px solid rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.15)", color: "#fff", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                  <LogOut size={14} /> Logout
                </button>
              </div>
            </header>
            <nav style={{ borderBottom: "1px solid #bae6fd", background: "#ffffff", padding: "0.5rem 1rem", overflowX: "auto" }}>
              <div style={{ display: "flex", gap: "6px" }}>
                {[
                  { key: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={14} /> },
                  { key: "approvals", label: "Approvals", icon: <FileCheck2 size={14} /> },
                  { key: "all-documents", label: "Documents", icon: <Files size={14} /> },
                  { key: "offices", label: "Offices", icon: <Building2 size={14} /> },
                  { key: "reports", label: "Reports", icon: <BarChart3 size={14} /> },
                  { key: "settings", label: "Settings", icon: <Settings size={14} /> },
                ].map(({ key, label, icon }) => (
                  <button key={key} type="button" onClick={() => setRoute(key as SystemAdminRoute)}
                    style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "0.4rem 0.75rem", borderRadius: "8px", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: "0.78rem", fontWeight: 500, whiteSpace: "nowrap", background: route === key ? "#e0f2fe" : "transparent", color: route === key ? "#0284c7" : "#64748b", transition: "all 0.15s" }}>
                    {icon}{label}
                  </button>
                ))}
              </div>
            </nav>
          </div>

          {/* Dashboard header bar */}
          {route === "dashboard" && (
            <header style={{ position: "sticky", top: 0, zIndex: 10, background: "rgba(240,249,255,0.92)", borderBottom: "1px solid #bae6fd", backdropFilter: "blur(8px)" }}>
              <div style={{ display: "flex", height: "64px", width: "100%", alignItems: "center", justifyContent: "space-between", gap: "1rem", padding: "0 2rem" }}>
                <div>
                  <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0c4a6e", letterSpacing: "-0.02em" }}>Dashboard</div>
                  <div style={{ fontSize: "0.72rem", color: "#0ea5e9", fontWeight: 500 }}>Overview · Bataan Capitol DTS</div>
                </div>
                <button onClick={onLogout} type="button" className="lg:hidden"
                  style={{ display: "flex", alignItems: "center", gap: "6px", padding: "0.4rem 0.85rem", borderRadius: "8px", border: "1.5px solid #fecaca", background: "#fff5f5", color: "#dc2626", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                  <LogOut size={14} /> Logout
                </button>
              </div>
            </header>
          )}

          {/* ── Pages ── */}
          {route === "approvals" ? (
            <div style={{ width: "100%", padding: "1.5rem 2rem" }}>
              <ApprovalsPage />
            </div>
          ) : route === "offices" ? (
            <div style={{ width: "100%", padding: "1.5rem 2rem" }}>
              <OfficesPage />
            </div>
          ) : route === "reports" ? (
            <div style={{ width: "100%", padding: "1.5rem 2rem" }}>
              <ReportsPage />
            </div>
          ) : route === "all-documents" ? (
            <div style={{ width: "100%", padding: "1.5rem 2rem" }}>
              <AllDocumentsPage />
            </div>
          ) : route === "settings" ? (
            <div style={{ width: "100%", padding: "1.5rem 2rem" }}>
              <SettingsPage />
            </div>
          ) : (
            /* ── Dashboard Content ── */
            <div style={{ width: "100%", padding: "1.5rem 2rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>

              {/* Stat cards */}
              <section style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
                {[
                  { label: "Ongoing Documents", sub: "In progress / active routing", value: statsLoading ? "…" : (stats?.ongoing.toLocaleString() ?? "0"), accent: "#0ea5e9", bg: "linear-gradient(135deg,#e0f2fe,#f0f9ff)", border: "#bae6fd", iconBg: "linear-gradient(135deg,#0ea5e9,#0284c7)", icon: <Files size={18} color="#fff" /> },
                  { label: "Total Accomplished", sub: "Completed documents", value: statsLoading ? "…" : (stats?.accomplished.toLocaleString() ?? "0"), accent: "#10b981", bg: "linear-gradient(135deg,#d1fae5,#f0fdf4)", border: "#a7f3d0", iconBg: "linear-gradient(135deg,#10b981,#059669)", icon: <FileCheck2 size={18} color="#fff" /> },
                  { label: "Total Discontinued", sub: "Closed / canceled", value: statsLoading ? "…" : (stats?.discontinued.toLocaleString() ?? "0"), accent: "#f43f5e", bg: "linear-gradient(135deg,#ffe4e6,#fff5f5)", border: "#fecdd3", iconBg: "linear-gradient(135deg,#f43f5e,#e11d48)", icon: <Files size={18} color="#fff" /> },
                  { label: "Exceeded Documents", sub: "Overdue task durations", value: statsLoading ? "…" : (stats?.exceeded?.toLocaleString() ?? "0"), accent: "#f59e0b", bg: "linear-gradient(135deg,#fef3c7,#fffbeb)", border: "#fde68a", iconBg: "linear-gradient(135deg,#f59e0b,#d97706)", icon: <BarChart3 size={18} color="#fff" /> },
                ].map(({ label, sub, value, accent, bg, border, iconBg, icon }) => (
                  <div key={label} style={{ borderRadius: "16px", border: `1px solid ${border}`, background: bg, padding: "1.4rem 1.5rem", boxShadow: "0 2px 12px rgba(14,165,233,0.07)", transition: "transform 0.15s, box-shadow 0.15s", cursor: "default", position: "relative", overflow: "hidden" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLDivElement).style.boxShadow = `0 8px 24px rgba(14,165,233,0.13)` }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 12px rgba(14,165,233,0.07)" }}
                  >
                    <div style={{ position: "absolute", top: "1rem", right: "1rem", width: "40px", height: "40px", borderRadius: "10px", background: iconBg, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 4px 12px ${accent}40` }}>{icon}</div>
                    <div style={{ fontSize: "0.72rem", fontWeight: 600, color: accent, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "0.5rem" }}>{label}</div>
                    <div style={{ fontSize: "2.25rem", fontWeight: 800, color: "#0c4a6e", lineHeight: 1, letterSpacing: "-0.04em", marginBottom: "0.4rem" }}>{value}</div>
                    <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 400 }}>{sub}</div>
                  </div>
                ))}
              </section>

              {/* Document Summary */}
              <section>
                <div style={{ borderRadius: "16px", border: "1px solid #bae6fd", background: "#ffffff", boxShadow: "0 2px 12px rgba(14,165,233,0.06)", overflow: "hidden" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", padding: "1.25rem 1.5rem", borderBottom: "1px solid #e0f2fe" }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#0c4a6e", letterSpacing: "-0.01em" }}>Document Summary</div>
                      <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "2px" }}>Overview by office</div>
                    </div>
                    <button type="button" onClick={() => setShowTable(!showTable)}
                      style={{ padding: "0.35rem 0.9rem", borderRadius: "8px", border: "1.5px solid #bae6fd", background: showTable ? "#e0f2fe" : "#f0f9ff", color: "#0284c7", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "#bae6fd" }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = showTable ? "#e0f2fe" : "#f0f9ff" }}
                    >
                      {showTable ? "Hide" : "View all"}
                    </button>
                  </div>
                  {showTable && (
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
                        <thead>
                          <tr style={{ background: "linear-gradient(to right, #e0f2fe, #f0f9ff)", borderBottom: "1px solid #bae6fd" }}>
                            {["Office", "In Transit", "On Process", "Ongoing", "Accomplished", "Discontinued", "Exceeded"].map(h => (
                              <th key={h} style={{ padding: "0.7rem 0.85rem", textAlign: "left", fontSize: "0.68rem", fontWeight: 700, color: "#0369a1", letterSpacing: "0.07em", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {statsLoading ? (
                            <tr><td colSpan={7} style={{ padding: "2.5rem", textAlign: "center", color: "#64748b", fontSize: "0.82rem" }}>Loading…</td></tr>
                          ) : stats?.officeSummary && stats.officeSummary.length > 0 ? (
                            stats.officeSummary.map((office, i) => (
                              <tr key={office.name} style={{ borderBottom: "1px solid #f0f9ff", background: i % 2 === 0 ? "#ffffff" : "#f8fcff", transition: "background 0.15s" }}
                                onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = "#e0f2fe" }}
                                onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = i % 2 === 0 ? "#ffffff" : "#f8fcff" }}
                              >
                                <td style={{ padding: "0.6rem 0.85rem", fontWeight: 600, color: "#0c4a6e" }}>{office.name}</td>
                                <td style={{ padding: "0.6rem 0.85rem", color: "#475569" }}>{office.inTransit}</td>
                                <td style={{ padding: "0.6rem 0.85rem", color: "#475569" }}>{office.onProcess}</td>
                                <td style={{ padding: "0.6rem 0.85rem", color: "#0284c7", fontWeight: 600 }}>{office.ongoing}</td>
                                <td style={{ padding: "0.6rem 0.85rem", color: "#059669", fontWeight: 600 }}>{office.accomplished}</td>
                                <td style={{ padding: "0.6rem 0.85rem", color: "#e11d48", fontWeight: 600 }}>{office.discontinued}</td>
                                <td style={{ padding: "0.6rem 0.85rem", color: "#d97706", fontWeight: 600 }}>{office.exceeded}</td>
                              </tr>
                            ))
                          ) : (
                            <tr><td colSpan={7} style={{ padding: "2.5rem", textAlign: "center", color: "#94a3b8", fontSize: "0.82rem" }}>No data available</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </section>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}