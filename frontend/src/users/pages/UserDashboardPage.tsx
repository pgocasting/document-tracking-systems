import { FileStack, Files, FolderSearch, LogOut, PanelLeftClose, PanelLeftOpen, Settings } from "lucide-react"
import { useEffect, useState } from "react"
import UserDocuments from "./UserDocuments"
import UserProfile from "./UserProfile"
import AllDocumentsPage from "../../admin/pages/AllDocumentsPage"
import API_URL from "../../lib/api"

type UserDashboardPageProps = {
  onLogout: () => void
  user?: {
    username: string
    role: string
    fullName?: string
    office?: string
  }
}

type UserRoute = "documents" | "all-documents" | "profile"

export default function UserDashboardPage({ onLogout, user }: UserDashboardPageProps) {
  const [route, setRoute] = useState<UserRoute>("documents")
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [officePrivileges, setOfficePrivileges] = useState<string[]>([])

  const hasPrivilege = (name: string) => {
    const needle = String(name || "").trim().toLowerCase()
    if (!needle) return false
    return officePrivileges.some((p) => String(p || "").trim().toLowerCase() === needle)
  }



  useEffect(() => {
    if (!user?.office) {
      setOfficePrivileges([])
      return
    }

    ;(async () => {
      try {
        const token = localStorage.getItem("token")
        const response = await fetch(`${API_URL}/offices`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) return
        const data = (await response.json()) as {
          offices?: Array<{ name?: string; privileges?: string[] }>
        }
        const offices = Array.isArray(data?.offices) ? data.offices : []

        const currentName = String(user.office || "").trim().toLowerCase()
        const matched = offices.find((o) => String(o?.name || "").trim().toLowerCase() === currentName)
        if (matched && Array.isArray(matched.privileges)) {
          setOfficePrivileges(matched.privileges.map((p) => String(p)))
        } else {
          setOfficePrivileges([])
        }
      } catch {
        setOfficePrivileges([])
      }
    })()
  }, [user?.office])




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
        {/* Sidebar */}
        <aside
          className="hidden lg:block"
          style={{
            background: "#ffffff",
            borderRight: "1px solid #bae6fd",
            boxShadow: "2px 0 16px rgba(14,165,233,0.07)",
          }}
        >
          <div style={{ display: "flex", height: "100dvh", flexDirection: "column" }}>
            {/* Logo Header */}
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
                    {user?.fullName || "User Portal"}
                  </div>
                </div>
              )}
            </div>

            {/* Navigation */}
            <nav style={{ flex: 1, padding: "0.75rem 0.625rem", display: "flex", flexDirection: "column", gap: "2px", overflowY: "auto" }}>
              {[
                { key: "documents", label: "Office Requests", icon: <FileStack size={16} /> },
                { key: "all-documents", label: "All Documents", icon: <FolderSearch size={16} /> },
                { key: "profile", label: "Account Settings", icon: <Settings size={16} /> },
              ].map(({ key, label, icon }) => {
                const isActive = route === key
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setRoute(key as UserRoute)}
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

            {/* Footer Actions */}
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

        {/* Mobile Header */}
        <div className="lg:hidden">
          <header style={{ position: "sticky", top: 0, zIndex: 10, background: "linear-gradient(135deg,#0ea5e9,#0284c7)", borderBottom: "1px solid #0284c7", backdropFilter: "blur(8px)" }}>
            <div style={{ display: "flex", height: "64px", width: "100%", alignItems: "center", justifyContent: "space-between", gap: "1rem", padding: "0 1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "rgba(255,255,255,0.2)", border: "2px solid rgba(255,255,255,0.45)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", padding: "3px", flexShrink: 0 }}>
                  <img src="/images/Bataan.png" alt="Bataan" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Bataan Capitol DTS</div>
                  <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>User Portal</div>
                </div>
              </div>
              <button onClick={onLogout} type="button"
                style={{ display: "flex", alignItems: "center", gap: "6px", padding: "0.4rem 0.85rem", borderRadius: "8px", border: "1.5px solid rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.15)", color: "#fff", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                <LogOut size={14} /> Logout
              </button>
            </div>
          </header>

          {/* Mobile Navigation */}
          <nav style={{ borderBottom: "1px solid #bae6fd", background: "#ffffff", padding: "0.5rem 1rem", overflowX: "auto" }}>
            <div style={{ display: "flex", gap: "6px" }}>
              {[
                { key: "documents", label: "Office Requests", icon: <FileStack size={14} /> },
                { key: "all-documents", label: "All", icon: <FolderSearch size={14} /> },
                { key: "profile", label: "Account Settings", icon: <Settings size={14} /> },
              ].map(({ key, label, icon }) => (
                <button key={key} type="button" onClick={() => setRoute(key as UserRoute)}
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "0.4rem 0.75rem", borderRadius: "8px", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: "0.78rem", fontWeight: 500, whiteSpace: "nowrap", background: route === key ? "#e0f2fe" : "transparent", color: route === key ? "#0284c7" : "#64748b", transition: "all 0.15s" }}>
                  {icon}{label}
                </button>
              ))}
            </div>
          </nav>
        </div>

        {/* Main Content */}
        <main style={{ minWidth: 0, height: "100dvh", overflowY: "auto", background: "#f0f9ff" }}>
          {route === "documents" ? (
            <UserDocuments />
          ) : route === "all-documents" ? (
            <div style={{ width: "100%", padding: "1.5rem 2rem" }}>
              <AllDocumentsPage title="All Documents" readOnly />
            </div>
          ) : route === "profile" ? (
            <UserProfile user={user} />
          ) : (
            <UserDocuments />
          )}
        </main>
      </div>
    </div>
  )
}