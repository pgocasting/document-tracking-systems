import { Eye } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import ObrTemplatePreview, { type ObrTemplateModel } from "../../components/ObrTemplatePreview"
import PrTemplatePreview from "../../components/PrTemplatePreview"
import { toast } from "../../lib/toast"

type SettingsTab =
  | "pr-and-obr"
  | "default-schedule"
  | "special-dates"
  | "change-password"

type TemplateType = "PR" | "OBR"

export type PrTemplateModel = {
  items?: Array<{
    itemNo: string
    unit: string
    description: string
    quantity: string
    unitCost: string
    totalCost: string
  }>
  trackingNo?: string
  fund: string
  department: string
  section: string
  prNo: string
  date: string
  fpp: string
  purpose: string
  requestedByName: string
  requestedByDesignation: string
  cashAvailabilityName: string
  cashAvailabilityDesignation: string
  approvedByName: string
  approvedByDesignation: string
  status?: string
  logs?: Array<{ label?: string; byOffice?: string;[key: string]: any }>
  hasPr?: boolean
  hasObr?: boolean
}

type WeekdayKey = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday"

type DaySchedule = {
  enabled: boolean
  from: string
  to: string
}

type SpecialDateSection = "recurrent" | "non-recurrent"

type SpecialDateEntry = {
  id: string
  date: string
  from: string | null
  to: string | null
  description: string
  section: SpecialDateSection
}

const RAW_API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api'
const API_URL = RAW_API_URL.replace(/\/$/, '').endsWith('/api')
  ? RAW_API_URL.replace(/\/$/, '')
  : `${RAW_API_URL.replace(/\/$/, '')}/api`

export default function SettingsPage() {
  const [tab, setTab] = useState<SettingsTab>("pr-and-obr")
  const [activeTemplate, setActiveTemplate] = useState<TemplateType | null>(null)
  const [obrModel, setObrModel] = useState<ObrTemplateModel>({
    payee: "PR",
    office: "N/A",
    address: "N/A",
    obrNo: "100-26-",
    date: "",
    fund: "",
    certifiedAName: "$DEPARTMENTHEAD",
    certifiedAPosition: "$designation",
    certifiedBName: "EDUARDO D. BANZON",
    certifiedBPosition: "Provincial Budget Officer",
  })
  const [prModel, setPrModel] = useState<PrTemplateModel>({
    fund: "",
    department: "",
    section: "",
    prNo: "",
    date: "",
    fpp: "",
    purpose: "",
    requestedByName: "$DEPARTMENTHEAD",
    requestedByDesignation: "$designation",
    cashAvailabilityName: "ALICIA R. MAGPANTAY",
    cashAvailabilityDesignation: "Provincial Treasurer",
    approvedByName: "JOSE ENRIQUE S. GARCIA III",
    approvedByDesignation: "Provincial Governor",
  })

  const [defaultSchedule, setDefaultSchedule] = useState<Record<WeekdayKey, DaySchedule>>({
    monday: { enabled: true, from: '08:00', to: '17:00' },
    tuesday: { enabled: true, from: '08:00', to: '17:00' },
    wednesday: { enabled: true, from: '08:00', to: '17:00' },
    thursday: { enabled: true, from: '08:00', to: '17:00' },
    friday: { enabled: true, from: '08:00', to: '17:00' },
    saturday: { enabled: false, from: '', to: '' },
    sunday: { enabled: false, from: '', to: '' },
  })
  const [scheduleSaving, setScheduleSaving] = useState(false)

  // Load persisted schedule from API
  useEffect(() => {
    fetch(`${API_URL}/settings/schedule`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.defaultSchedule) setDefaultSchedule(data.defaultSchedule)
      })
      .catch(() => { /* ignore – use default */ })
  }, [])

  async function saveSchedule() {
    setScheduleSaving(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_URL}/settings/schedule`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ defaultSchedule }),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        toast.error(errData.message || 'Failed to save schedule.')
      } else {
        toast.success('Schedule saved successfully.')
      }
    } catch {
      toast.error('Network error. Could not save schedule.')
    } finally {
      setScheduleSaving(false)
    }
  }

  const [specialDates, setSpecialDates] = useState<SpecialDateEntry[]>([])
  const [isAddSpecialDateOpen, setIsAddSpecialDateOpen] = useState(false)
  const [specialDateDraft, setSpecialDateDraft] = useState<{
    date: string
    from: string
    to: string
    description: string
    section: SpecialDateSection
    noWorkSchedule: boolean
  }>({
    date: "",
    from: "",
    to: "",
    description: "",
    section: "recurrent",
    noWorkSchedule: false,
  })
  const [specialDateDraftError, setSpecialDateDraftError] = useState<string | null>(null)

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmNewPassword, setConfirmNewPassword] = useState("")
  const [passwordSaving, setPasswordSaving] = useState(false)

  async function updatePassword() {
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      toast.error("Please fill in all password fields.")
      return
    }
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters.")
      return
    }
    if (newPassword !== confirmNewPassword) {
      toast.error("New passwords do not match.")
      return
    }

    setPasswordSaving(true)
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${API_URL}/auth/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword: confirmNewPassword,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.message || "Failed to update password.")
        return
      }
      toast.success("Password updated successfully.")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmNewPassword("")
    } catch {
      toast.error("Network error. Could not update password.")
    } finally {
      setPasswordSaving(false)
    }
  }

  // Load persisted special dates from API
  useEffect(() => {
    fetch(`${API_URL}/settings/special-dates`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (Array.isArray(data?.specialDates)) setSpecialDates(data.specialDates)
      })
      .catch(() => { })
  }, [])

  async function saveSpecialDates(dates: SpecialDateEntry[]) {
    try {
      const token = localStorage.getItem('token')
      await fetch(`${API_URL}/settings/special-dates`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ specialDates: dates }),
      })
    } catch {
      // silently ignore – the UI already updated optimistically
    }
  }

  const isTemplateModalOpen = activeTemplate !== null

  const tabs = useMemo(
    () => [
      { key: "pr-and-obr" as const, label: "PR and OBR" },
      { key: "default-schedule" as const, label: "Default Schedule" },
      { key: "special-dates" as const, label: "Special Dates" },
      { key: "change-password" as const, label: "Change Password" },
    ],
    []
  )

  return (
    <div className="w-full space-y-6">
      <header className="flex flex-col gap-1">
        <div className="text-lg font-semibold tracking-tight text-slate-900">System Settings</div>
        <div className="text-sm text-muted-foreground">Update system settings</div>
      </header>

      <div className="rounded-xl border border-slate-200 bg-white text-slate-900 shadow-sm">
        <div className="border-b border-slate-200 px-4 pt-4 lg:px-6">
          <div className="flex flex-wrap gap-2">
            {tabs.map((t) => {
              const isActive = tab === t.key
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(t.key)}
                  className={`inline-flex h-9 items-center justify-center whitespace-nowrap rounded-md px-3 text-sm font-medium transition-colors focus:outline-none focus-visible:outline-none ${isActive
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                >
                  {t.label}
                </button>
              )
            })}
          </div>
          <div className="h-4" />
        </div>

        <div className="p-4 lg:p-6">
          {tab === "pr-and-obr" ? (
            <div className="space-y-4">
              <div>
                <div className="text-base font-semibold tracking-tight">PR and OBR Template</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  Manage the templates used for PR and OBR forms.
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="relative w-full overflow-auto">
                  <table className="w-full caption-bottom text-sm">
                    <thead className="bg-slate-50 [&_tr]:border-b">
                      <tr className="border-b border-slate-200">
                        <th className="h-10 px-4 text-left align-middle text-xs font-semibold uppercase tracking-wide text-slate-600">
                          Templates
                        </th>
                        <th className="h-10 px-4 text-left align-middle text-xs font-semibold uppercase tracking-wide text-slate-600">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="[&_tr:last-child]:border-0">
                      <tr className="border-b border-slate-200 transition-colors hover:bg-slate-50">
                        <td className="px-4 py-3 align-middle font-medium">PR</td>
                        <td className="px-4 py-3 align-middle">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setActiveTemplate("PR")}
                              className="inline-flex h-9 items-center justify-center rounded-md bg-slate-900 px-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-slate-800 focus:outline-none focus-visible:outline-none"
                              title="View / Edit PR Template"
                            >
                              <Eye className="mr-2 size-4" />
                              View
                            </button>
                          </div>
                        </td>
                      </tr>
                      <tr className="border-b border-slate-200 transition-colors hover:bg-slate-50">
                        <td className="px-4 py-3 align-middle font-medium">OBR</td>
                        <td className="px-4 py-3 align-middle">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setActiveTemplate("OBR")}
                              className="inline-flex h-9 items-center justify-center rounded-md bg-slate-900 px-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-slate-800 focus:outline-none focus-visible:outline-none"
                              title="View / Edit OBR Template"
                            >
                              <Eye className="mr-2 size-4" />
                              View
                            </button>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : tab === "default-schedule" ? (
            <div className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <div className="text-base font-semibold tracking-tight">Default Schedules</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    Set default office working hours used by the system.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={saveSchedule}
                  disabled={scheduleSaving}
                  className="inline-flex h-9 items-center justify-center rounded-md bg-slate-900 px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-slate-800 focus:outline-none focus-visible:outline-none disabled:opacity-60"
                >
                  {scheduleSaving ? 'Saving…' : 'Save schedules'}
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {(
                  [
                    { key: "monday", label: "Monday" },
                    { key: "tuesday", label: "Tuesday" },
                    { key: "wednesday", label: "Wednesday" },
                    { key: "thursday", label: "Thursday" },
                    { key: "friday", label: "Friday" },
                    { key: "saturday", label: "Saturday" },
                    { key: "sunday", label: "Sunday" },
                  ] as const
                ).map((d) => {
                  const day = defaultSchedule[d.key]
                  return (
                    <div
                      key={d.key}
                      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold">{d.label}</div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {day.enabled ? "Working day" : "Closed"}
                          </div>
                        </div>
                        <label
                          htmlFor={`${d.key}-enabled`}
                          className="inline-flex cursor-pointer items-center"
                          title={day.enabled ? "Disable" : "Enable"}
                        >
                          <input
                            id={`${d.key}-enabled`}
                            type="checkbox"
                            className="sr-only"
                            checked={day.enabled}
                            onChange={() =>
                              setDefaultSchedule((v) => ({
                                ...v,
                                [d.key]: {
                                  ...v[d.key],
                                  enabled: !v[d.key].enabled,
                                  from: !v[d.key].enabled ? v[d.key].from || "08:00" : v[d.key].from,
                                  to: !v[d.key].enabled ? v[d.key].to || "17:00" : v[d.key].to,
                                },
                              }))
                            }
                          />
                          <span
                            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors ${day.enabled
                              ? "border-slate-900 bg-slate-900"
                              : "border-slate-200 bg-slate-200"
                              }`}
                          >
                            <span
                              className={`inline-block size-5 rounded-full bg-white shadow-sm transition-transform ${day.enabled ? "translate-x-5" : "translate-x-1"
                                }`}
                            />
                          </span>
                        </label>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="grid gap-2">
                          <label
                            htmlFor={`${d.key}-from`}
                            className="text-xs font-medium text-slate-600"
                          >
                            From
                          </label>
                          <input
                            id={`${d.key}-from`}
                            type="time"
                            className={`h-9 rounded-md border bg-white px-3 text-sm shadow-sm focus:outline-none focus-visible:outline-none ${day.enabled ? "border-slate-200" : "border-slate-200 opacity-50"
                              }`}
                            value={day.from}
                            disabled={!day.enabled}
                            onChange={(e) =>
                              setDefaultSchedule((v) => ({
                                ...v,
                                [d.key]: { ...v[d.key], from: e.target.value },
                              }))
                            }
                          />
                        </div>

                        <div className="grid gap-2">
                          <label
                            htmlFor={`${d.key}-to`}
                            className="text-xs font-medium text-slate-600"
                          >
                            To
                          </label>
                          <input
                            id={`${d.key}-to`}
                            type="time"
                            className={`h-9 rounded-md border bg-white px-3 text-sm shadow-sm focus:outline-none focus-visible:outline-none ${day.enabled ? "border-slate-200" : "border-slate-200 opacity-50"
                              }`}
                            value={day.to}
                            disabled={!day.enabled}
                            onChange={(e) =>
                              setDefaultSchedule((v) => ({
                                ...v,
                                [d.key]: { ...v[d.key], to: e.target.value },
                              }))
                            }
                          />
                        </div>
                      </div>

                      <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
                        {day.enabled && day.from && day.to
                          ? `Active: ${day.from} - ${day.to}`
                          : "No working hours set"}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : tab === "special-dates" ? (
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold">Additional Dates</div>
                  <div className="mt-1 text-sm text-muted-foreground">Manage holidays and special processing dates.</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSpecialDateDraftError(null)
                    setSpecialDateDraft({
                      date: "",
                      from: "",
                      to: "",
                      description: "",
                      section: "recurrent",
                      noWorkSchedule: false,
                    })
                    setIsAddSpecialDateOpen(true)
                  }}
                  className="inline-flex h-9 items-center justify-center rounded-md bg-slate-900 px-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-slate-800 focus:outline-none focus-visible:outline-none"
                >
                  Add New Date
                </button>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <div className="overflow-hidden rounded-xl border border-slate-200">
                  <div className="bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Recurrent Events</div>
                  <div className="overflow-auto">
                    <table className="w-full border-collapse text-sm">
                      <thead className="bg-slate-50 text-left text-xs text-slate-600">
                        <tr className="border-b border-slate-200">
                          <th className="px-3 py-2 font-semibold">Date</th>
                          <th className="px-3 py-2 font-semibold">From</th>
                          <th className="px-3 py-2 font-semibold">To</th>
                          <th className="px-3 py-2 font-semibold">Description</th>
                          <th className="px-3 py-2 font-semibold">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {specialDates.filter((d) => d.section === "recurrent").length === 0 ? (
                          <tr className="border-b border-slate-200">
                            <td className="px-3 py-3 text-sm text-slate-600" colSpan={5}>
                              No entries
                            </td>
                          </tr>
                        ) : (
                          specialDates
                            .filter((d) => d.section === "recurrent")
                            .map((d) => (
                              <tr key={d.id} className="border-b border-slate-200">
                                <td className="px-3 py-2">{d.date}</td>
                                <td className="px-3 py-2">{d.from ?? "n/a"}</td>
                                <td className="px-3 py-2">{d.to ?? "n/a"}</td>
                                <td className="px-3 py-2">{d.description || ""}</td>
                                <td className="px-3 py-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const next = specialDates.filter((x) => x.id !== d.id)
                                      setSpecialDates(next)
                                      saveSpecialDates(next)
                                    }}
                                    className="inline-flex h-8 items-center justify-center rounded-md bg-red-600 px-3 text-xs font-medium text-white shadow-sm transition-colors hover:bg-red-700 focus:outline-none focus-visible:outline-none"
                                  >
                                    Delete
                                  </button>
                                </td>
                              </tr>
                            ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-slate-200">
                  <div className="bg-emerald-700 px-4 py-2 text-sm font-semibold text-white">Non-recurrent Events</div>
                  <div className="overflow-auto">
                    <table className="w-full border-collapse text-sm">
                      <thead className="bg-slate-50 text-left text-xs text-slate-600">
                        <tr className="border-b border-slate-200">
                          <th className="px-3 py-2 font-semibold">Date</th>
                          <th className="px-3 py-2 font-semibold">From</th>
                          <th className="px-3 py-2 font-semibold">To</th>
                          <th className="px-3 py-2 font-semibold">Description</th>
                          <th className="px-3 py-2 font-semibold">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {specialDates.filter((d) => d.section === "non-recurrent").length === 0 ? (
                          <tr className="border-b border-slate-200">
                            <td className="px-3 py-3 text-sm text-slate-600" colSpan={5}>
                              No entries
                            </td>
                          </tr>
                        ) : (
                          specialDates
                            .filter((d) => d.section === "non-recurrent")
                            .map((d) => (
                              <tr key={d.id} className="border-b border-slate-200">
                                <td className="px-3 py-2">{d.date}</td>
                                <td className="px-3 py-2">{d.from ?? "n/a"}</td>
                                <td className="px-3 py-2">{d.to ?? "n/a"}</td>
                                <td className="px-3 py-2">{d.description || ""}</td>
                                <td className="px-3 py-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const next = specialDates.filter((x) => x.id !== d.id)
                                      setSpecialDates(next)
                                      saveSpecialDates(next)
                                    }}
                                    className="inline-flex h-8 items-center justify-center rounded-md bg-red-600 px-3 text-xs font-medium text-white shadow-sm transition-colors hover:bg-red-700 focus:outline-none focus-visible:outline-none"
                                  >
                                    Delete
                                  </button>
                                </td>
                              </tr>
                            ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="text-sm font-semibold">Change Password</div>
                <div className="mt-1 text-sm text-muted-foreground">Update your account password.</div>

                <div className="mt-4 grid gap-2">
                  <label htmlFor="current-password" className="text-xs font-medium text-slate-600">
                    Current password
                  </label>
                  <input
                    id="current-password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm shadow-sm focus:outline-none focus-visible:outline-none"
                  />
                  <label htmlFor="new-password" className="mt-2 text-xs font-medium text-slate-600">
                    New password
                  </label>
                  <input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm shadow-sm focus:outline-none focus-visible:outline-none"
                  />
                  <label htmlFor="confirm-new-password" className="mt-2 text-xs font-medium text-slate-600">
                    Confirm new password
                  </label>
                  <input
                    id="confirm-new-password"
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm shadow-sm focus:outline-none focus-visible:outline-none"
                  />

                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      disabled={passwordSaving}
                      onClick={() => void updatePassword()}
                      className="inline-flex h-9 items-center justify-center rounded-md bg-slate-900 px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-slate-800 focus:outline-none focus-visible:outline-none disabled:opacity-60"
                    >
                      {passwordSaving ? "Updating..." : "Update password"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="text-sm font-semibold">Security</div>
                <div className="mt-1 text-sm text-muted-foreground">Recommended security actions.</div>
                <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                  Password should be at least 8 characters.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {isTemplateModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => {
            if (e.currentTarget === e.target) {
              setActiveTemplate(null)
            }
          }}
        >
          <div className="flex h-[80vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 lg:px-6">
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">
                  {activeTemplate === "PR" ? "Purchase Request (PR) Template" : "Obligation Request (OBR) Template"}
                </div>
                <div className="truncate text-xs text-muted-foreground">Edit template details and settings</div>
              </div>
            </div>

            <div className="grid flex-1 gap-0 overflow-hidden lg:grid-cols-[1fr_360px]">
              <div className="h-full overflow-auto bg-slate-50 p-4 lg:p-6">
                {activeTemplate === "OBR" ? (
                  <ObrTemplatePreview model={obrModel} />
                ) : activeTemplate === "PR" ? (
                  <PrTemplatePreview model={prModel} />
                ) : (
                  <div className="mx-auto w-full max-w-3xl rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="aspect-3/4 w-full rounded-lg border border-slate-200 bg-white" />
                    <div className="mt-3 text-xs text-muted-foreground">
                      Preview placeholder (you can connect this to the real template renderer later).
                    </div>
                  </div>
                )}
              </div>

              <div className="h-full overflow-auto border-l border-slate-200 bg-white p-4 lg:p-6">
                {activeTemplate === "OBR" ? (
                  <div>
                    <div className="text-sm font-semibold">Editor</div>
                    <div className="mt-1 text-sm text-muted-foreground">Edit OBR details.</div>

                    <div className="mt-4 grid gap-3">
                      <div className="grid gap-2">
                        <label htmlFor="obr-no" className="text-xs font-medium text-slate-600">
                          OBR No.
                        </label>
                        <input
                          id="obr-no"
                          className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm shadow-sm focus:outline-none focus-visible:outline-none"
                          value={obrModel.obrNo}
                          onChange={(e) => setObrModel((v) => ({ ...v, obrNo: e.target.value }))}
                        />
                      </div>

                      <div className="grid gap-2">
                        <label htmlFor="obr-payee" className="text-xs font-medium text-slate-600">
                          Payee
                        </label>
                        <input
                          id="obr-payee"
                          className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm shadow-sm focus:outline-none focus-visible:outline-none"
                          value={obrModel.payee}
                          onChange={(e) => setObrModel((v) => ({ ...v, payee: e.target.value }))}
                        />
                      </div>

                      <div className="grid gap-2">
                        <label htmlFor="obr-office" className="text-xs font-medium text-slate-600">
                          Office
                        </label>
                        <input
                          id="obr-office"
                          className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm shadow-sm focus:outline-none focus-visible:outline-none"
                          value={obrModel.office}
                          onChange={(e) => setObrModel((v) => ({ ...v, office: e.target.value }))}
                        />
                      </div>

                      <div className="grid gap-2">
                        <label htmlFor="obr-address" className="text-xs font-medium text-slate-600">
                          Address
                        </label>
                        <input
                          id="obr-address"
                          className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm shadow-sm focus:outline-none focus-visible:outline-none"
                          value={obrModel.address}
                          onChange={(e) => setObrModel((v) => ({ ...v, address: e.target.value }))}
                        />
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <div className="text-xs font-semibold text-slate-700">Certified A</div>
                        <div className="mt-2 grid gap-2">
                          <label htmlFor="obr-certified-a-name" className="text-xs font-medium text-slate-600">
                            Printed name
                          </label>
                          <input
                            id="obr-certified-a-name"
                            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm shadow-sm focus:outline-none focus-visible:outline-none"
                            value={obrModel.certifiedAName}
                            onChange={(e) => setObrModel((v) => ({ ...v, certifiedAName: e.target.value }))}
                          />
                          <label htmlFor="obr-certified-a-position" className="text-xs font-medium text-slate-600">
                            Position
                          </label>
                          <input
                            id="obr-certified-a-position"
                            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm shadow-sm focus:outline-none focus-visible:outline-none"
                            value={obrModel.certifiedAPosition}
                            onChange={(e) => setObrModel((v) => ({ ...v, certifiedAPosition: e.target.value }))}
                          />
                        </div>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <div className="text-xs font-semibold text-slate-700">Certified B</div>
                        <div className="mt-2 grid gap-2">
                          <label htmlFor="obr-certified-b-name" className="text-xs font-medium text-slate-600">
                            Printed name
                          </label>
                          <input
                            id="obr-certified-b-name"
                            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm shadow-sm focus:outline-none focus-visible:outline-none"
                            value={obrModel.certifiedBName}
                            onChange={(e) => setObrModel((v) => ({ ...v, certifiedBName: e.target.value }))}
                          />
                          <label htmlFor="obr-certified-b-position" className="text-xs font-medium text-slate-600">
                            Position
                          </label>
                          <input
                            id="obr-certified-b-position"
                            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm shadow-sm focus:outline-none focus-visible:outline-none"
                            value={obrModel.certifiedBPosition}
                            onChange={(e) => setObrModel((v) => ({ ...v, certifiedBPosition: e.target.value }))}
                          />
                        </div>
                      </div>

                      <div className="pt-2">
                        <button
                          type="button"
                          className="inline-flex h-9 w-full items-center justify-center rounded-md bg-slate-900 px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-slate-800 focus:outline-none focus-visible:outline-none"
                        >
                          Save changes
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTemplate(null)}
                          className="mt-2 inline-flex h-9 w-full items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-medium shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus-visible:outline-none"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                ) : activeTemplate === "PR" ? (
                  <div>
                    <div className="text-sm font-semibold">Editor</div>
                    <div className="mt-1 text-sm text-muted-foreground">Edit PR details.</div>

                    <div className="mt-4 grid gap-3">
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <div className="text-xs font-semibold text-slate-700">Requested by</div>
                        <div className="mt-2 grid gap-2">
                          <label htmlFor="pr-requested-name" className="text-xs font-medium text-slate-600">
                            Printed name
                          </label>
                          <input
                            id="pr-requested-name"
                            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm shadow-sm focus:outline-none focus-visible:outline-none disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                            value={prModel.requestedByName}
                            disabled
                          />
                          <label htmlFor="pr-requested-desig" className="text-xs font-medium text-slate-600">
                            Designation
                          </label>
                          <input
                            id="pr-requested-desig"
                            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm shadow-sm focus:outline-none focus-visible:outline-none disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                            value={prModel.requestedByDesignation}
                            disabled
                          />
                        </div>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <div className="text-xs font-semibold text-slate-700">Cash Availability</div>
                        <div className="mt-2 grid gap-2">
                          <label htmlFor="pr-cash-name" className="text-xs font-medium text-slate-600">
                            Printed name
                          </label>
                          <input
                            id="pr-cash-name"
                            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm shadow-sm focus:outline-none focus-visible:outline-none"
                            value={prModel.cashAvailabilityName}
                            onChange={(e) => setPrModel((v) => ({ ...v, cashAvailabilityName: e.target.value }))}
                          />
                          <label htmlFor="pr-cash-desig" className="text-xs font-medium text-slate-600">
                            Designation
                          </label>
                          <input
                            id="pr-cash-desig"
                            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm shadow-sm focus:outline-none focus-visible:outline-none"
                            value={prModel.cashAvailabilityDesignation}
                            onChange={(e) => setPrModel((v) => ({ ...v, cashAvailabilityDesignation: e.target.value }))}
                          />
                        </div>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <div className="text-xs font-semibold text-slate-700">Approved by</div>
                        <div className="mt-2 grid gap-2">
                          <label htmlFor="pr-approved-name" className="text-xs font-medium text-slate-600">
                            Printed name
                          </label>
                          <input
                            id="pr-approved-name"
                            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm shadow-sm focus:outline-none focus-visible:outline-none"
                            value={prModel.approvedByName}
                            onChange={(e) => setPrModel((v) => ({ ...v, approvedByName: e.target.value }))}
                          />
                          <label htmlFor="pr-approved-desig" className="text-xs font-medium text-slate-600">
                            Designation
                          </label>
                          <input
                            id="pr-approved-desig"
                            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm shadow-sm focus:outline-none focus-visible:outline-none"
                            value={prModel.approvedByDesignation}
                            onChange={(e) => setPrModel((v) => ({ ...v, approvedByDesignation: e.target.value }))}
                          />
                        </div>
                      </div>

                      <div className="pt-2">
                        <button
                          type="button"
                          className="inline-flex h-9 w-full items-center justify-center rounded-md bg-slate-900 px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-slate-800 focus:outline-none focus-visible:outline-none"
                        >
                          Save changes
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTemplate(null)}
                          className="mt-2 inline-flex h-9 w-full items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-medium shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus-visible:outline-none"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="text-sm font-semibold">Editor</div>
                    <div className="mt-1 text-sm text-muted-foreground">Update template metadata and defaults.</div>

                    <div className="mt-4 grid gap-3">
                      <div className="grid gap-2">
                        <label htmlFor="template-name" className="text-xs font-medium text-slate-600">
                          Template name
                        </label>
                        <input
                          id="template-name"
                          className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm shadow-sm focus:outline-none focus-visible:outline-none"
                          defaultValue="PR"
                        />
                      </div>

                      <div className="grid gap-2">
                        <label htmlFor="template-title" className="text-xs font-medium text-slate-600">
                          Document title
                        </label>
                        <input
                          id="template-title"
                          className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm shadow-sm focus:outline-none focus-visible:outline-none"
                          defaultValue="Purchase Request"
                        />
                      </div>

                      <div className="pt-2">
                        <button
                          type="button"
                          className="inline-flex h-9 w-full items-center justify-center rounded-md bg-slate-900 px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-slate-800 focus:outline-none focus-visible:outline-none"
                        >
                          Save changes
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTemplate(null)}
                          className="mt-2 inline-flex h-9 w-full items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-medium shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus-visible:outline-none"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {isAddSpecialDateOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => {
            if (e.currentTarget === e.target) {
              setIsAddSpecialDateOpen(false)
            }
          }}
        >
          <div className="w-full max-w-xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">Add New Date to the List</div>
              </div>
            </div>

            <div className="grid gap-4 px-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="special-date" className="text-xs font-medium text-slate-600">
                  Date
                </label>
                <input
                  id="special-date"
                  type="date"
                  className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm shadow-sm focus:outline-none focus-visible:outline-none"
                  value={specialDateDraft.date}
                  onChange={(e) => {
                    setSpecialDateDraftError(null)
                    setSpecialDateDraft((v) => ({ ...v, date: e.target.value }))
                  }}
                />
              </div>

              <div className="grid gap-2">
                <div className="flex items-center justify-between gap-3">
                  <label htmlFor="special-from" className="text-xs font-medium text-slate-600">
                    From
                  </label>
                  <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={specialDateDraft.noWorkSchedule}
                      onChange={(e) => {
                        setSpecialDateDraftError(null)
                        const checked = e.target.checked
                        setSpecialDateDraft((v) => ({
                          ...v,
                          noWorkSchedule: checked,
                          from: checked ? "" : v.from,
                          to: checked ? "" : v.to,
                        }))
                      }}
                    />
                    No Work Schedule
                  </label>
                </div>
                <input
                  id="special-from"
                  type="time"
                  disabled={specialDateDraft.noWorkSchedule}
                  className={`h-9 rounded-md border bg-white px-3 text-sm shadow-sm focus:outline-none focus-visible:outline-none ${specialDateDraft.noWorkSchedule ? "border-slate-200 opacity-50" : "border-slate-200"
                    }`}
                  value={specialDateDraft.from}
                  onChange={(e) => {
                    setSpecialDateDraftError(null)
                    setSpecialDateDraft((v) => ({ ...v, noWorkSchedule: false, from: e.target.value }))
                  }}
                />
              </div>

              <div className="grid gap-2">
                <label htmlFor="special-to" className="text-xs font-medium text-slate-600">
                  To
                </label>
                <input
                  id="special-to"
                  type="time"
                  disabled={specialDateDraft.noWorkSchedule}
                  className={`h-9 rounded-md border bg-white px-3 text-sm shadow-sm focus:outline-none focus-visible:outline-none ${specialDateDraft.noWorkSchedule ? "border-slate-200 opacity-50" : "border-slate-200"
                    }`}
                  value={specialDateDraft.to}
                  onChange={(e) => {
                    setSpecialDateDraftError(null)
                    setSpecialDateDraft((v) => ({ ...v, noWorkSchedule: false, to: e.target.value }))
                  }}
                />
              </div>

              <div className="grid gap-2">
                <label htmlFor="special-description" className="text-xs font-medium text-slate-600">
                  Description
                </label>
                <input
                  id="special-description"
                  type="text"
                  className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm shadow-sm focus:outline-none focus-visible:outline-none"
                  value={specialDateDraft.description}
                  onChange={(e) => {
                    setSpecialDateDraftError(null)
                    setSpecialDateDraft((v) => ({ ...v, description: e.target.value }))
                  }}
                />
              </div>

              <div className="grid gap-2">
                <label htmlFor="special-section" className="text-xs font-medium text-slate-600">
                  Section
                </label>
                <select
                  id="special-section"
                  className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm shadow-sm focus:outline-none focus-visible:outline-none"
                  value={specialDateDraft.section}
                  onChange={(e) => {
                    setSpecialDateDraftError(null)
                    const v = e.target.value === "non-recurrent" ? "non-recurrent" : "recurrent"
                    setSpecialDateDraft((cur) => ({ ...cur, section: v }))
                  }}
                >
                  <option value="recurrent">Recurrent (will recur yearly)</option>
                  <option value="non-recurrent">Non-recurrent (one-time)</option>
                </select>
              </div>

              {specialDateDraftError ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {specialDateDraftError}
                </div>
              ) : null}

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    if (!specialDateDraft.date) {
                      setSpecialDateDraftError("Date is required.")
                      return
                    }
                    if (!specialDateDraft.noWorkSchedule) {
                      if (!specialDateDraft.from || !specialDateDraft.to) {
                        setSpecialDateDraftError("From and To are required unless No Work Schedule is selected.")
                        return
                      }
                      if (specialDateDraft.to <= specialDateDraft.from) {
                        setSpecialDateDraftError("To must be later than From.")
                        return
                      }
                    }

                    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`
                    const newEntry: SpecialDateEntry = {
                      id,
                      date: specialDateDraft.date,
                      from: specialDateDraft.noWorkSchedule ? null : specialDateDraft.from,
                      to: specialDateDraft.noWorkSchedule ? null : specialDateDraft.to,
                      description: specialDateDraft.description,
                      section: specialDateDraft.section,
                    }
                    const next = [...specialDates, newEntry]
                    setSpecialDates(next)
                    saveSpecialDates(next)
                    setIsAddSpecialDateOpen(false)
                  }}
                  className="inline-flex h-9 items-center justify-center rounded-md bg-emerald-700 px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-800 focus:outline-none focus-visible:outline-none"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
