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
    <div className="min-h-dvh bg-slate-50">
      <div
        className={`grid min-h-dvh grid-cols-1 ${isSidebarCollapsed ? "lg:grid-cols-[80px_1fr]" : "lg:grid-cols-[260px_1fr]"
          }`}
      >
        {/* Sidebar */}
        <aside className="hidden border-r border-slate-200 bg-white lg:block">
          <div className="flex h-dvh flex-col">
            {/* Logo Header */}
            <div
              className={`flex h-16 items-center gap-3 border-b border-slate-200 ${isSidebarCollapsed ? "justify-center px-3" : "px-5"
                }`}
            >
              <div
                className={`grid size-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-background shadow ${isSidebarCollapsed ? "mx-auto" : ""
                  }`}
              >
                <img
                  src="/images/Bataan.png"
                  alt="Bataan"
                  className="size-full object-contain p-1"
                />
              </div>
              {isSidebarCollapsed ? null : (
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">Bataan Capitol DTS</div>
                  <div className="truncate text-xs text-muted-foreground">{user?.fullName || ""}</div>
                </div>
              )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1 p-3">
              <button
                className={navButtonClass(route === "documents")}
                type="button"
                onClick={() => setRoute("documents")}
                title="Office Requests"
              >
                <FileStack className="size-4 text-slate-500 group-hover:text-slate-700" />
                {isSidebarCollapsed ? null : "Office Requests"}
              </button>
              <button
                className={navButtonClass(route === "all-documents")}
                type="button"
                onClick={() => setRoute("all-documents")}
                title="All Documents"
              >
                <FolderSearch className="size-4 text-slate-500 group-hover:text-slate-700" />
                {isSidebarCollapsed ? null : "All Documents"}
              </button>

              <button
                className={navButtonClass(route === "profile")}
                type="button"
                onClick={() => setRoute("profile")}
                title="Account Settings"
              >
                <Settings className="size-4 text-slate-500 group-hover:text-slate-700" />
                {isSidebarCollapsed ? null : "Account Settings"}
              </button>
            </nav>

            {/* Footer Actions */}
            <div className="border-t border-slate-200 p-3">
              <button
                type="button"
                onClick={() => setIsSidebarCollapsed((v) => !v)}
                className={`mb-2 inline-flex h-9 w-full items-center gap-2 whitespace-nowrap rounded-md border border-slate-200 bg-white py-2 text-sm font-medium shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus-visible:outline-none ${isSidebarCollapsed ? "justify-center px-2" : "justify-start px-4"
                  }`}
                title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {isSidebarCollapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
                {isSidebarCollapsed ? null : "Collapse sidebar"}
              </button>

              <button
                className={`inline-flex h-9 w-full items-center gap-2 whitespace-nowrap rounded-md border border-slate-200 bg-white py-2 text-sm font-medium shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus-visible:outline-none ${isSidebarCollapsed ? "justify-center px-2" : "justify-start px-4"
                  }`}
                onClick={onLogout}
                type="button"
                title="Logout"
              >
                <LogOut className="size-4" />
                {isSidebarCollapsed ? null : "Logout"}
              </button>
            </div>
          </div>
        </aside>

        {/* Mobile Header */}
        <div className="lg:hidden">
          <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
            <div className="flex h-16 w-full items-center justify-between gap-4 px-4">
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center overflow-hidden rounded-xl bg-background shadow">
                  <img
                    src="/images/Bataan.png"
                    alt="Bataan"
                    className="size-full object-contain p-1"
                  />
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">Bataan Capitol DTS</div>
                  <div className="truncate text-xs text-muted-foreground">User Portal</div>
                </div>
              </div>
              <button
                className="inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-md border border-slate-200 bg-white px-3 text-sm font-medium shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus-visible:outline-none"
                onClick={onLogout}
                type="button"
              >
                <LogOut className="size-4" />
                Logout
              </button>
            </div>
          </header>

          {/* Mobile Navigation */}
          <nav className="border-b border-slate-200 bg-white px-4 py-2">
            <div className="flex gap-2 overflow-x-auto">
                <button
                  className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap ${route === "documents"
                    ? "bg-slate-100 text-slate-900"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  onClick={() => setRoute("documents")}
                  type="button"
                >
                  <FileStack className="size-4" />
                  Office Requests
                </button>
              <button
                className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap ${route === "all-documents"
                  ? "bg-slate-100 text-slate-900"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                onClick={() => setRoute("all-documents")}
              >
                <FolderSearch className="size-4" />
                All
              </button>

              <button
                className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap ${route === "profile"
                  ? "bg-slate-100 text-slate-900"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                onClick={() => setRoute("profile")}
              >
                <Settings className="size-4" />
                Account Settings
              </button>
            </div>
          </nav>
        </div>

        {/* Main Content */}
        <main className="min-w-0 h-dvh overflow-y-auto">
          {route === "documents" ? (
            <UserDocuments />
          ) : route === "all-documents" ? (
            <div className="w-full px-4 py-6 lg:px-8">
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