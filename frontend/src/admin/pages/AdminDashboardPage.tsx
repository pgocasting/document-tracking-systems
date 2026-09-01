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
    <div className="min-h-dvh bg-slate-50">
      <div
        className={`grid min-h-dvh grid-cols-1 ${isSidebarCollapsed ? "lg:grid-cols-[80px_1fr]" : "lg:grid-cols-[260px_1fr]"
          }`}
      >
        <aside className="hidden border-r border-slate-200 bg-white lg:block">
          <div className="flex h-dvh flex-col">
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
                  <div className="truncate text-xs text-muted-foreground">System Admin</div>
                </div>
              )}
            </div>

            <nav className="flex-1 space-y-1 p-3">
              <button
                className={navButtonClass(route === "dashboard")}
                type="button"
                onClick={() => setRoute("dashboard")}
                title="Dashboard"
              >
                <LayoutDashboard className="size-4 text-slate-700" />
                {isSidebarCollapsed ? null : "Dashboard"}
              </button>
              <button
                className={navButtonClass(route === "approvals")}
                type="button"
                onClick={() => setRoute("approvals")}
                title="Approvals"
              >
                <FileCheck2 className="size-4 text-slate-500 group-hover:text-slate-700" />
                {isSidebarCollapsed ? null : "Approvals"}
              </button>
              <button
                className={navButtonClass(route === "all-documents")}
                type="button"
                onClick={() => setRoute("all-documents")}
                title="All Documents"
              >
                <Files className="size-4 text-slate-500 group-hover:text-slate-700" />
                {isSidebarCollapsed ? null : "All Documents"}
              </button>
              <button
                className={navButtonClass(route === "offices")}
                type="button"
                onClick={() => setRoute("offices")}
                title="Offices"
              >
                <Building2 className="size-4 text-slate-500 group-hover:text-slate-700" />
                {isSidebarCollapsed ? null : "Offices"}
              </button>
              <button
                className={navButtonClass(route === "reports")}
                type="button"
                onClick={() => setRoute("reports")}
                title="Reports"
              >
                <BarChart3 className="size-4 text-slate-500 group-hover:text-slate-700" />
                {isSidebarCollapsed ? null : "Reports"}
              </button>
              <button
                className={navButtonClass(route === "settings")}
                type="button"
                onClick={() => setRoute("settings")}
                title="Settings"
              >
                <Settings className="size-4 text-slate-500 group-hover:text-slate-700" />
                {isSidebarCollapsed ? null : "Settings"}
              </button>
            </nav>

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

        <main className="min-w-0 h-dvh overflow-y-auto">
          <div className="lg:hidden">
            <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
              <div className="flex h-16 w-full items-center justify-between gap-4 px-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-background shadow">
                    <img src="/images/Bataan.png" alt="Bataan" className="size-full object-contain p-1" />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">Bataan Capitol DTS</div>
                    <div className="truncate text-xs text-muted-foreground">{mobileRouteLabel}</div>
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

            <nav className="border-b border-slate-200 bg-white px-4 py-2">
              <div className="flex gap-2 overflow-x-auto">
                <button
                  className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap ${route === "dashboard"
                    ? "bg-slate-100 text-slate-900"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  onClick={() => setRoute("dashboard")}
                  type="button"
                >
                  <LayoutDashboard className="size-4" />
                  Dashboard
                </button>
                <button
                  className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap ${route === "approvals"
                    ? "bg-slate-100 text-slate-900"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  onClick={() => setRoute("approvals")}
                  type="button"
                >
                  <FileCheck2 className="size-4" />
                  Approvals
                </button>
                <button
                  className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap ${route === "all-documents"
                    ? "bg-slate-100 text-slate-900"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  onClick={() => setRoute("all-documents")}
                  type="button"
                >
                  <Files className="size-4" />
                  Documents
                </button>
                <button
                  className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap ${route === "offices"
                    ? "bg-slate-100 text-slate-900"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  onClick={() => setRoute("offices")}
                  type="button"
                >
                  <Building2 className="size-4" />
                  Offices
                </button>
                <button
                  className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap ${route === "reports"
                    ? "bg-slate-100 text-slate-900"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  onClick={() => setRoute("reports")}
                  type="button"
                >
                  <BarChart3 className="size-4" />
                  Reports
                </button>
                <button
                  className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap ${route === "settings"
                    ? "bg-slate-100 text-slate-900"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  onClick={() => setRoute("settings")}
                  type="button"
                >
                  <Settings className="size-4" />
                  Settings
                </button>
              </div>
            </nav>
          </div>

          {route === "dashboard" ? (
            <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
              <div className="flex h-16 w-full items-center justify-between gap-4 px-4 lg:px-8">
                <div className="min-w-0">
                  <div className="truncate text-lg font-semibold tracking-tight text-slate-900">Dashboard</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-md border border-slate-200 bg-white px-3 text-sm font-medium shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus-visible:outline-none lg:hidden"
                    onClick={onLogout}
                    type="button"
                  >
                    <LogOut className="size-4" />
                    Logout
                  </button>
                </div>
              </div>
            </header>
          ) : null}

          {route === "approvals" ? (
            <div className="w-full px-4 py-6 lg:px-8">
              <ApprovalsPage />
            </div>
          ) : route === "offices" ? (
            <div className="w-full px-4 py-6 lg:px-8">
              <OfficesPage />
            </div>
          ) : route === "reports" ? (
            <div className="w-full px-4 py-6 lg:px-8">
              <ReportsPage />
            </div>
          ) : route === "all-documents" ? (
            <div className="w-full px-4 py-6 lg:px-8">
              <AllDocumentsPage />
            </div>
          ) : route === "settings" ? (
            <div className="w-full px-4 py-6 lg:px-8">
              <SettingsPage />
            </div>
          ) : (
            <div className="w-full space-y-6 px-4 py-6 lg:px-8">
              <section className="grid gap-4 md:grid-cols-4">
                <div className="relative overflow-hidden rounded-xl border border-sky-200 bg-sky-50 text-sky-900 shadow-sm transition-shadow hover:shadow">
                  <div className="absolute inset-0 bg-sky-100" />
                  <div className="relative flex flex-col space-y-1.5 p-6 pb-2">
                    <div className="text-sm font-medium text-sky-700">Ongoing Documents</div>
                    <div className="text-3xl font-semibold leading-none tracking-tight text-sky-900">
                      {statsLoading ? "..." : stats?.ongoing.toLocaleString() ?? "0"}
                    </div>
                  </div>
                  <div className="relative p-6 pt-0 text-sm text-sky-600">
                    In progress / active routing
                  </div>
                </div>

                <div className="relative overflow-hidden rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-900 shadow-sm transition-shadow hover:shadow">
                  <div className="absolute inset-0 bg-emerald-100" />
                  <div className="relative flex flex-col space-y-1.5 p-6 pb-2">
                    <div className="text-sm font-medium text-emerald-700">Total Accomplished</div>
                    <div className="text-3xl font-semibold leading-none tracking-tight text-emerald-900">
                      {statsLoading ? "..." : stats?.accomplished.toLocaleString() ?? "0"}
                    </div>
                  </div>
                  <div className="relative p-6 pt-0 text-sm text-emerald-600">
                    Completed documents
                  </div>
                </div>

                <div className="relative overflow-hidden rounded-xl border border-rose-200 bg-rose-50 text-rose-900 shadow-sm transition-shadow hover:shadow">
                  <div className="absolute inset-0 bg-rose-100" />
                  <div className="relative flex flex-col space-y-1.5 p-6 pb-2">
                    <div className="text-sm font-medium text-rose-700">Total Discontinued</div>
                    <div className="text-3xl font-semibold leading-none tracking-tight text-rose-900">
                      {statsLoading ? "..." : stats?.discontinued.toLocaleString() ?? "0"}
                    </div>
                  </div>
                  <div className="relative p-6 pt-0 text-sm text-rose-600">
                    Closed / canceled
                  </div>
                </div>

                <div className="relative overflow-hidden rounded-xl border border-amber-200 bg-amber-50 text-amber-900 shadow-sm transition-shadow hover:shadow">
                  <div className="absolute inset-0 bg-amber-100" />
                  <div className="relative flex flex-col space-y-1.5 p-6 pb-2">
                    <div className="text-sm font-medium text-amber-700">Exceeded Documents</div>
                    <div className="text-3xl font-semibold leading-none tracking-tight text-amber-900">
                      {statsLoading ? "..." : stats?.exceeded?.toLocaleString() ?? "0"}
                    </div>
                  </div>
                  <div className="relative p-6 pt-0 text-sm text-amber-600">
                    Overdue task durations
                  </div>
                </div>
              </section>

              <section>
                <div className="rounded-xl border border-slate-200 bg-white text-slate-900 shadow-sm">
                  <div className="flex items-center justify-between gap-4 p-6">
                    <div>
                      <div className="font-semibold leading-none tracking-tight">Document Summary</div>
                      <div className="text-sm text-muted-foreground">Overview by office</div>
                    </div>
                    <button
                      className="inline-flex h-8 items-center justify-center whitespace-nowrap rounded-md border border-slate-200 bg-white px-3 text-xs font-medium shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus-visible:outline-none"
                      type="button"
                      onClick={() => setShowTable(!showTable)}
                    >
                      {showTable ? "Hide" : "View all"}
                    </button>
                  </div>

                  {showTable && (
                    <div className="p-6 pt-0">
                      <div className="relative w-full overflow-auto">
                        <table className="w-full caption-bottom text-sm">
                          <thead className="bg-slate-50 [&_tr]:border-b">
                            <tr className="border-b border-slate-200">
                              <th className="h-10 px-3 text-left align-middle text-xs font-semibold uppercase tracking-wide text-slate-600">
                                Office
                              </th>
                              <th className="h-10 px-3 text-left align-middle text-xs font-semibold uppercase tracking-wide text-slate-600">
                                In Transit
                              </th>
                              <th className="h-10 px-3 text-left align-middle text-xs font-semibold uppercase tracking-wide text-slate-600">
                                On Process
                              </th>
                              <th className="h-10 px-3 text-left align-middle text-xs font-semibold uppercase tracking-wide text-slate-600">
                                Ongoing
                              </th>
                              <th className="h-10 px-3 text-left align-middle text-xs font-semibold uppercase tracking-wide text-slate-600">
                                Accomplished
                              </th>
                              <th className="h-10 px-3 text-left align-middle text-xs font-semibold uppercase tracking-wide text-slate-600">
                                Discontinued
                              </th>
                              <th className="h-10 px-3 text-left align-middle text-xs font-semibold uppercase tracking-wide text-slate-600">
                                Exceeded
                              </th>
                            </tr>
                          </thead>
                          <tbody className="[&_tr:last-child]:border-0">
                            {statsLoading ? (
                              <tr>
                                <td className="px-3 py-10 text-center text-sm text-slate-600" colSpan={7}>
                                  Loading...
                                </td>
                              </tr>
                            ) : stats?.officeSummary && stats.officeSummary.length > 0 ? (
                              stats.officeSummary.map((office) => (
                                <tr key={office.name} className="border-b border-slate-200 transition-colors hover:bg-slate-50">
                                  <td className="px-3 py-2 align-middle font-medium">{office.name}</td>
                                  <td className="px-3 py-2 align-middle text-slate-700">{office.inTransit}</td>
                                  <td className="px-3 py-2 align-middle text-slate-700">{office.onProcess}</td>
                                  <td className="px-3 py-2 align-middle text-sky-700 font-medium">
                                    {office.ongoing}
                                  </td>
                                  <td className="px-3 py-2 align-middle text-emerald-700 font-medium">
                                    {office.accomplished}
                                  </td>
                                  <td className="px-3 py-2 align-middle text-rose-700 font-medium">
                                    {office.discontinued}
                                  </td>
                                  <td className="px-3 py-2 align-middle text-amber-700 font-medium">
                                    {office.exceeded}
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td className="px-3 py-10 text-center text-sm text-slate-600" colSpan={7}>
                                  No data available
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
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
