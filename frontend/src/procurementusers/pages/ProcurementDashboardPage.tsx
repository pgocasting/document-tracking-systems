import {
  BarChart3,
  ClipboardCheck,
  Clock3,
  FileText,
  FileStack,
  Files,
  FolderSearch,
  LayoutDashboard,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
} from "lucide-react"
import { useEffect, useMemo, useState, useCallback } from "react"
import { useDocumentSocket } from "../../hooks/useSocket"
import ApprovalsPage from "../../admin/pages/ApprovalsPage"
import ReceivedTransferPage from "./ReceivedTransferPage"
import ProcurementReviewPage from "./ProcurementReviewPage"
import ProcurementRecentlyTransferred from "./ProcurementRecentlyTransferred"
import PlaceholderPanel from "../components/PlaceholderPanel"
import UserProfile from "../../users/pages/UserProfile"
import UserDocuments from "../../users/pages/UserDocuments"
import AllDocumentsPage from "../../admin/pages/AllDocumentsPage"
import API_URL from "../../lib/api"

type DashboardStats = {
  pending: number
  ongoing: number
  exceeded: number
}

function normalizeOfficeKey(officeRaw: string) {
  const s = String(officeRaw || '').trim().toLowerCase()
  if (!s) return ''
  if (s === 'gso' || s.includes('general services') || s.includes('gso')) return 'gso'
  if (s === 'bac' || s.includes('bids') || s.includes('awards') || s.includes('bac')) return 'bac'
  if (s === 'budget' || s.includes('budget')) return 'budget'
  if (s === 'pto' || s.includes('treasurer') || s.includes('pto')) return 'pto'
  if (s === 'pgo' || s.includes('governor') || s.includes('pgo')) return 'pgo'
  if (s.includes('accounting')) return 'accounting'
  if (s.includes('admin')) return 'admin'
  if (s.includes('end user')) return 'end user'
  return s
}

function officeMatches(aRaw: string, bRaw: string) {
  const a = normalizeOfficeKey(aRaw)
  const b = normalizeOfficeKey(bRaw)
  if (!a || !b) return false
  return a === b || a.includes(b) || b.includes(a)
}

function getLastTransferTimeToOffice(rawLogs: any[], officeLower: string) {
  const officeNeedle = normalizeOfficeKey(officeLower)
  if (!officeNeedle) return null
  const prefix = 'transferred to'

  for (let i = rawLogs.length - 1; i >= 0; i -= 1) {
    const labelLower = String(rawLogs[i]?.label || '').trim().toLowerCase()
    let destOffice = ''

    if (labelLower.startsWith(prefix)) {
      const afterPrefix = labelLower.slice(prefix.length).trim()
      if (!afterPrefix) continue
      const officeMatch = afterPrefix.match(/^([^(:]+)/)
      destOffice = String(officeMatch ? officeMatch[1] : afterPrefix).trim()
    } else {
      // Legacy: "Approved: Transferred to OFFICE (...)"
      const legacyMatch = labelLower.match(/approved[:\s]+transferred\s+to\s+([^(:]+)/i)
      if (legacyMatch) destOffice = normalizeOfficeKey(String(legacyMatch[1]).trim()) || ''
    }

    if (!destOffice) continue
    if (!officeMatches(destOffice, officeNeedle)) continue

    const ts = new Date(String(rawLogs[i]?.createdAt || '')).getTime()
    return Number.isFinite(ts) ? ts : null
  }

  return null
}

function getLastTransferIndexToOffice(rawLogs: any[], officeLower: string) {
  const officeNeedle = normalizeOfficeKey(officeLower)
  if (!officeNeedle) return null
  const prefix = 'transferred to'

  for (let i = rawLogs.length - 1; i >= 0; i -= 1) {
    const labelLower = String(rawLogs[i]?.label || '').trim().toLowerCase()
    let destOffice = ''

    if (labelLower.startsWith(prefix)) {
      const afterPrefix = labelLower.slice(prefix.length).trim()
      if (!afterPrefix) continue
      const officeMatch = afterPrefix.match(/^([^(:]+)/)
      destOffice = String(officeMatch ? officeMatch[1] : afterPrefix).trim()
    } else {
      // Legacy: "Approved: Transferred to OFFICE (...)"
      const legacyMatch = labelLower.match(/approved[:\s]+transferred\s+to\s+([^(:]+)/i)
      if (legacyMatch) destOffice = normalizeOfficeKey(String(legacyMatch[1]).trim()) || ''
    }

    if (!destOffice) continue
    if (!officeMatches(destOffice, officeNeedle)) continue

    return i
  }

  return null
}


function getLastTransferredOffice(rawLogs: any[]) {
  const logs = Array.isArray(rawLogs) ? rawLogs : []
  const prefix = 'transferred to'
  for (let i = logs.length - 1; i >= 0; i -= 1) {
    const labelLower = String(logs[i]?.label || '').trim().toLowerCase()
    // Primary match: starts with "transferred to"
    if (labelLower.startsWith(prefix)) {
      const afterPrefix = labelLower.slice(prefix.length).trim()
      if (!afterPrefix) continue
      const officeMatch = afterPrefix.match(/^([^(:]+)/)
      const destOffice = String(officeMatch ? officeMatch[1] : afterPrefix).trim()
      if (destOffice) return normalizeOfficeKey(destOffice)
    }
    // Legacy back-compat: "Approved: Transferred to OFFICE (...)" format
    const legacyMatch = labelLower.match(/approved[:\s]+transferred\s+to\s+([^(:]+)/i)
    if (legacyMatch) {
      const destOffice = String(legacyMatch[1]).trim()
      if (destOffice) return normalizeOfficeKey(destOffice)
    }
  }
  return null
}


function hasReceivedForOffice(
  doc: { logs?: Array<{ label?: string; byOffice?: string; createdAt?: string }> } | null | undefined,
  officeLower: string
) {
  const currentOffice = normalizeOfficeKey(officeLower)
  if (!currentOffice) return false
  const rawLogs = Array.isArray(doc?.logs) ? (doc?.logs as any[]) : []

  // Find the last transfer to THIS office.
  // We use BOTH timestamp and index-based ordering.
  // - Timestamp is best when present
  // - Index fallback prevents false positives when createdAt is missing/invalid
  const lastTransferTs = getLastTransferTimeToOffice(rawLogs, currentOffice)
  const lastTransferIdx = getLastTransferIndexToOffice(rawLogs, currentOffice)

  // If there is no transfer-to-this-office log, don't count as received for stats.
  // This prevents old "Received" logs from making a doc look Ongoing in an office
  // that it wasn't transferred to.
  if (lastTransferTs == null && lastTransferIdx == null) return false

  return rawLogs.some((l, idx) => {
    const label = String(l?.label || '').trim().toLowerCase()
    const byOffice = String(l?.byOffice || '').trim()
    if (!label.startsWith('received')) return false

    // Check byOffice field (primary) or fall back to checking the label text
    const byOfficeNorm = normalizeOfficeKey(byOffice)
    const officeMatch = byOfficeNorm
      ? officeMatches(byOfficeNorm, currentOffice)
      : label.includes(currentOffice.toLowerCase())
    if (!officeMatch) return false

    // Only count if the Received log came AFTER the transfer to this office.
    // Prefer timestamp comparison when both timestamps are valid; otherwise
    // fall back to array order using the last transfer index.
    const receivedTs = new Date(String(l?.createdAt || '')).getTime()
    if (Number.isFinite(receivedTs) && typeof lastTransferTs === 'number' && Number.isFinite(lastTransferTs)) {
      return receivedTs >= lastTransferTs
    }

    if (typeof lastTransferIdx === 'number') {
      return idx >= lastTransferIdx
    }

    return false
  })
}

function hasReceivedForOfficeLogs(
  rawLogs: Array<{ label?: string; byOffice?: string; createdAt?: string }> | null | undefined,
  officeLower: string
) {
  return hasReceivedForOffice({ logs: rawLogs || [] }, officeLower)
}

function hasApprovalLogByOffice(
  doc: { logs?: Array<{ label?: string; byOffice?: string }> } | null | undefined,
  officeLowerRaw: string
) {
  const officeLower = String(officeLowerRaw || '').trim().toLowerCase()
  if (!officeLower) return false
  const rawLogs = Array.isArray(doc?.logs) ? (doc?.logs as any[]) : []

  for (let i = rawLogs.length - 1; i >= 0; i -= 1) {
    const l = rawLogs[i]
    if (!l) continue
    const labelLower = String(l?.label || '').trim().toLowerCase()

    // If we hit a "transferred to [this office]" OR a "remarks:" from end-user,
    // before seeing any approval log, it means the document is back in our queue!
    if (labelLower.startsWith('remarks:') || labelLower.startsWith('remarks ')) {
      return false
    }

    if (labelLower.startsWith('transferred to')) {
      const destMatch = labelLower.match(/transferred to\s+([^(:]+)/i)
      if (destMatch) {
        const destStr = destMatch[1].trim().toLowerCase()
        if (destStr === officeLower || destStr.includes(officeLower) || officeLower.includes(destStr)) {
          return false
        }
      }
      continue
    }

    const byOfficeLower = String(l?.byOffice || '').trim().toLowerCase()
    const isApprovalLabel = labelLower.includes('approved') || labelLower.includes('returned')
    if (!isApprovalLabel) continue

    if (byOfficeLower) {
      if (byOfficeLower === officeLower || byOfficeLower.includes(officeLower) || officeLower.includes(byOfficeLower)) {
        return true
      }
    } else {
      if (labelLower.startsWith(`${officeLower}:`)) return true
      const startsWithOffice = labelLower.startsWith(`${officeLower} `)
      if (startsWithOffice) return true
    }
  }

  return false
}

function hasTransferredToOffice(doc: { logs?: Array<{ label?: string }> } | null | undefined, officeLower: string) {
  const currentOffice = normalizeOfficeKey(officeLower)
  if (!currentOffice) return false
  const rawLogs = Array.isArray(doc?.logs) ? (doc?.logs as any[]) : []
  const lastDest = getLastTransferredOffice(rawLogs)
  if (!lastDest) return false
  return officeMatches(lastDest, currentOffice)
}

function hasTransferredToOfficeLogs(
  rawLogs: Array<{ label?: string }> | null | undefined,
  officeLower: string
) {
  return hasTransferredToOffice({ logs: rawLogs || [] }, officeLower)
}

function ProcurementMyDashboard({ officeLabel }: { officeLabel: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<DashboardStats>({ pending: 0, ongoing: 0, exceeded: 0 })

  const officeLower = String(officeLabel || "").toLowerCase()
  const isGso = officeLower.includes("gso")
  const isBac = officeLower.includes("bac") || officeLower.includes("bids") || officeLower.includes("awards")
  const isBudget = officeLower.includes("budget")
  const isPto = officeLower.includes("pto")

  const loadStats = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      if (!String(officeLabel || "").trim()) {
        setStats({ pending: 0, ongoing: 0, exceeded: 0 })
        return
      }

      const token = localStorage.getItem("token")

      // Fetch offices for task durations
      const offRes = await fetch(`${API_URL}/offices`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      let transferTasksByOffice: Record<string, any[]> = {}
      if (offRes.ok) {
        const offData = await offRes.json()
        const list = Array.isArray(offData?.offices) ? offData.offices : []
        list.forEach((o: any) => {
          const name = String(o?.name || '').toUpperCase()
          transferTasksByOffice[name] = Array.isArray(o?.tasks) ? o.tasks : []
        })
      }

      const response = await fetch(`${API_URL}/documents`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) throw new Error("Failed to fetch documents")

      const data = (await response.json()) as {
        documents: Array<{
          status?: string
          logs?: Array<{ label?: string; byOffice?: string; createdAt?: string }>
          subDocuments?: Array<{
            status?: string
            logs?: Array<{ label?: string; byOffice?: string; createdAt?: string }>
            trackingNo?: string
          }>
        }>
      }
      const docs = Array.isArray(data.documents) ? data.documents : []

      const isTerminalStatus = (statusRaw: string) => {
        const statusLower = String(statusRaw || "").toLowerCase()
        return (
          statusLower === "completed" ||
          statusLower === "returned" ||
          statusLower === "discontinued" ||
          statusLower === "cancelled" ||
          statusLower === "canceled"
        )
      }

      const isInOfficeScope = (statusRaw: string) => {
        const s = String(statusRaw || "").toLowerCase()
        if (isBudget) return s === "in-budget"
        if (isPto) return s === "in-pto"
        if (isGso) return s === "pending" || s === "pending-gso"
        if (isBac)
          return (
            s === "pending" ||
            s === "pending-gso" ||
            s === "pending-bac" ||
            s === "for-validation" ||
            s === "pre-validation"
          )
        return true
      }

      const parseDurationToMs = (durationStr: string) => {
        const s = String(durationStr || '').toLowerCase().trim();
        if (!s) return 0;
        const match = s.match(/^(\d+(?:\.\d+)?)\s*(day|days|hour|hours|hr|hrs|min|mins|minute|minutes|sec|secs|second|seconds)$/);
        if (!match) return 0;
        const value = parseFloat(match[1]);
        const unit = match[2];
        if (unit.startsWith('day')) return value * 24 * 60 * 60 * 1000;
        if (unit.startsWith('hour') || unit === 'hr' || unit === 'hrs') return value * 60 * 60 * 1000;
        if (unit.startsWith('min')) return value * 60 * 1000;
        if (unit.startsWith('sec')) return value * 1000;
        return 0;
      };

      const toWorkItems = (d: any) => {
        const subs = Array.isArray(d?.subDocuments) ? d.subDocuments : []
        const mainItem = {
          status: String(d?.status || ''),
          logs: Array.isArray(d?.logs) ? (d.logs as any[]) : [],
        }
        const subItems = subs.map((s: any) => ({
          status: String(s?.status || ''),
          logs: Array.isArray(s?.logs) ? (s.logs as any[]) : [],
        }))
        return [mainItem, ...subItems]
      }

      const items = docs.flatMap(toWorkItems)

      const scoped = items.filter((it) => {
        if (isTerminalStatus(String(it?.status || ""))) return false
        if (isInOfficeScope(String(it?.status || ""))) return true
        // Fallback: check if the last transfer log points to this office
        // (handles reprocessed docs whose status field may be stale)
        const rawLogs = Array.isArray(it?.logs) ? it.logs : []
        for (let i = rawLogs.length - 1; i >= 0; i--) {
          const label = String(rawLogs[i]?.label || "").trim().toLowerCase()
          if (label.startsWith("transferred to")) {
            const after = label.slice("transferred to".length).trim()
            const match = after.match(/^([^(:]+)/)
            const dest = String(match ? match[1] : after).trim()
            return officeMatches(dest, officeLower)
          }
        }
        return false
      })

      const pending = scoped.filter((it) => {
        if (!hasTransferredToOfficeLogs(it.logs, officeLower)) return false
        if (hasReceivedForOfficeLogs(it.logs, officeLower)) return false
        // Pending should not be affected by approval logs for office
        if (hasApprovalLogByOffice({ logs: it.logs }, officeLower)) return false
        return true
      }).length

      // Ongoing should only include items that are CURRENTLY in this office's queue:
      // last transfer destination is this office AND the item has been received after that transfer.
      const ongoingItems = scoped.filter((it) =>
        hasTransferredToOfficeLogs(it.logs, officeLower) && hasReceivedForOfficeLogs(it.logs, officeLower)
      )
      const ongoing = ongoingItems.length

      let exceededCount = 0
      ongoingItems.forEach((it) => {
        const logs = Array.isArray(it.logs) ? [...it.logs].reverse() : []
        const latestMovementLog = logs.find(l => {
          const lbl = String(l?.label || '').toLowerCase()
          return lbl.startsWith('received') ||
            lbl.startsWith('transferred') ||
            lbl.startsWith('approved') ||
            lbl.startsWith('completed') ||
            lbl.includes('returned') ||
            lbl.startsWith('discontinued')
        })

        if (latestMovementLog && String(latestMovementLog.label || '').toLowerCase().startsWith('received')) {
          const offKey = String(latestMovementLog.byOffice || '').trim().toUpperCase()
          const lbl = String(latestMovementLog.label || '')
          const taskName = (() => {
            const m1 = lbl.match(/received\s*(?:for\s*)?(.*)$/i)
            if (m1?.[1]) return m1[1].trim()
            const m2 = lbl.match(/\(([^)]+)\)\s*$/)
            return m2?.[1] ? m2[1].trim() : ''
          })()

          if (offKey && taskName) {
            const officeTasks = transferTasksByOffice[offKey] || []
            const task = officeTasks.find(t =>
              String(t?.task || '').trim().toLowerCase() === taskName.toLowerCase()
            )
            if (task?.duration) {
              const ms = parseDurationToMs(task.duration)
              const start = new Date(String(latestMovementLog.createdAt || '')).getTime()
              if (ms > 0 && Number.isFinite(start)) {
                if (Date.now() > (start + ms)) exceededCount++
              }
            }
          }
        }
      })

      setStats({ pending, ongoing, exceeded: exceededCount })
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load dashboard")
    } finally {
      setLoading(false)
    }
  }, [officeLabel, officeLower, isGso, isBac, isBudget, isPto])

  // Real-time updates handler
  const handleDocumentChange = useCallback(() => {
    void loadStats()
  }, [loadStats])

  // Initialize Socket.IO for real-time updates
  useDocumentSocket(
    {
      userId: officeLabel,
      office: officeLabel,
      role: 'procurement',
    },
    handleDocumentChange
  )

  const title = useMemo(() => {
    if (isGso) return "Dashboard - GSO"
    if (isBac) return "Dashboard - BAC"
    if (isBudget) return "Dashboard - Budget"
    if (isPto) return "Dashboard - PTO"
    return "Dashboard"
  }, [isBac, isBudget, isGso, isPto])

  useEffect(() => {
    loadStats()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [officeLabel])

  return (
    <div className="w-full space-y-4">
      <div>
        <div className="text-base font-semibold text-slate-900">{title}</div>
        <div className="text-sm text-slate-600">Overview of your office queue</div>
      </div>

      {error ? <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div> : null}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm font-medium text-slate-600">Pending</div>
          <div className="mt-2 text-3xl font-semibold text-slate-900">{loading ? "…" : stats.pending}</div>
          <div className="mt-1 text-xs text-slate-500">Transferred to your office, waiting to be received</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm font-medium text-slate-600">Ongoing</div>
          <div className="mt-2 text-3xl font-semibold text-slate-900">{loading ? "…" : stats.ongoing}</div>
          <div className="mt-1 text-xs text-slate-500">Received by your office and currently in progress</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm font-medium text-slate-600">Exceeded</div>
          <div className="mt-2 text-3xl font-semibold text-slate-900">{loading ? "…" : stats.exceeded}</div>
          <div className="mt-1 text-xs text-slate-500">Overdue task durations</div>
        </div>
      </div>
    </div>
  )
}

type ProcurementDashboardPageProps = {
  onLogout: () => void
  user?: {
    username: string
    role: string
    fullName?: string
    office?: string
  }
}

export default function ProcurementDashboardPage({ onLogout, user }: ProcurementDashboardPageProps) {
  type ProcurementRoute =
    | "dashboard"
    | "my-documents"
    | "all-documents"
    | "review"
    | "reports"
    | "history"
    | "recently-transferred"
    | "account-settings"

  const [route, setRoute] = useState<ProcurementRoute>("dashboard")
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [reviewCount, setReviewCount] = useState(0)
  const [officePrivileges, setOfficePrivileges] = useState<string[]>([])
  const [historyView, setHistoryView] = useState<"received-transfer" | "approvals">("received-transfer")

  const mobileRouteLabel =
    route === "dashboard"
      ? "Dashboard"
      : route === "my-documents"
        ? "Office Requests"
        : route === "all-documents"
          ? "All Documents"
          : route === "review"
            ? "Review"
            : route === "reports"
              ? "Reports"
              : route === "history"
                ? "History"
                : route === "recently-transferred"
                  ? "Recently Transferred"
                  : "Account Settings"

  const navOfficeLower = String(user?.office || "").toLowerCase()
  const navIsGso = navOfficeLower.includes("gso")
  const navIsBac = navOfficeLower.includes("bac") || navOfficeLower.includes("bids") || navOfficeLower.includes("awards")
  const navIsBudget = navOfficeLower.includes("budget")
  const navIsPto = navOfficeLower.includes("pto") || navOfficeLower.includes("treasurer")

  // All procurement offices follow the same flow, privileges determine access
  const isProcurementOffice = navIsGso || navIsBac || navIsBudget || navIsPto

  const hasPrivilege = (name: string) => {
    const needle = String(name || "").trim().toLowerCase()
    if (!needle) return false
    return officePrivileges.some((p) => String(p || "").trim().toLowerCase() === needle)
  }

  const canSeeOfficeRequests = hasPrivilege("Office Requests")

  const canUseReview = isProcurementOffice && hasPrivilege("Request Approval")
  const canSeeApprovalsHistory = isProcurementOffice

  useEffect(() => {
    if (!canSeeApprovalsHistory && historyView === "approvals") {
      setHistoryView("received-transfer")
    }
  }, [canSeeApprovalsHistory, historyView])

  useEffect(() => {
    if (!user?.office) {
      setOfficePrivileges([])
      return
    }

    ; (async () => {
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

  useEffect(() => {
    if (!canSeeOfficeRequests && route === "my-documents") {
      setRoute("dashboard")
    }
  }, [canSeeOfficeRequests, route])

  useEffect(() => {
    if (!canUseReview && route === "review") {
      setRoute("dashboard")
    }
  }, [canUseReview, route])

  useEffect(() => {
    if (!user?.office) {
      setReviewCount(0)
      return
    }

    let cancelled = false

    const compute = async () => {
      try {
        const token = localStorage.getItem("token")
        const response = await fetch(`${API_URL}/documents`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) return

        const data = (await response.json()) as { documents?: any[] }
        const docs = Array.isArray(data?.documents) ? data.documents : []

        const officeLower = String(user?.office || "").trim().toLowerCase()

        const isGsoOffice = navIsGso
        const isBacOffice = navIsBac
        const isBudgetOffice = navIsBudget
        const isPtoOffice = navIsPto

        const matchesStatusForOffice = (rawStatus: string) => {
          const s = String(rawStatus || "").trim().toLowerCase()
          // Keep 'for-revision' to allow back-and-forth review
          if (isGsoOffice) return s === "pending" || s === "pending-gso" || s === "for-revision"
          if (isBacOffice)
            return (
              s === "pending" ||
              s === "pending-gso" ||
              s === "pending-bac" ||
              s === "for-validation" ||
              s === "pre-validation" ||
              s === "for-revision"
            )
          if (isBudgetOffice) return s === "in-budget" || s === "for-revision"
          if (isPtoOffice) return s === "in-pto" || s === "for-revision"
          return s === "pending" || s === "pending-gso" || s === "pending-bac" || s === "for-revision"
        }

        const hasApprovalLogByCurrentOffice = (rawLogs: any[]) => {
          return hasApprovalLogByOffice({ logs: rawLogs }, officeLower)
        }

        const count = docs.filter((d: any) => {
          const parentStatusLower = String(d?.status || "").trim().toLowerCase()
          const allowedParentStatuses = new Set([
            "pending",
            "pending-gso",
            "pending-bac",
            "for-validation",
            "pre-validation",
            "for-revision",
            "reprocessed",
          ])
          if (!allowedParentStatuses.has(parentStatusLower)) return false

          const isForApproval = (() => {
            if (matchesStatusForOffice(d?.status || "pending")) return true

            if (Array.isArray(d?.subDocuments)) {
              if (d.subDocuments.some((sub: any) => matchesStatusForOffice(sub?.status || "pending"))) return true
            }
            // Fallback: for budget/pto, allow transfer-log based inclusion if status is stale
            if (isBudgetOffice || isPtoOffice) {
              const mainLogs = Array.isArray(d?.logs) ? d.logs : []
              const targetOffice = isBudgetOffice ? "budget" : "pto"
              for (let i = mainLogs.length - 1; i >= 0; i--) {
                const label = String(mainLogs[i]?.label || "").trim().toLowerCase()
                if (label.startsWith("transferred to")) {
                  const after = label.slice("transferred to".length).trim()
                  const match = after.match(/^([^(:]+)/)
                  const dest = String(match ? match[1] : after).trim().toLowerCase()
                  return dest === targetOffice || dest.includes(targetOffice)
                }
              }
            }
            return false
          })()

          if (!isForApproval) return false

          const mainLogs = Array.isArray(d?.logs) ? d.logs : []
          // Exclude already approved/returned by this office.
          // This helper also treats end-user remarks / re-transfer as resetting the cycle.
          if (hasApprovalLogByOffice({ logs: mainLogs }, officeLower)) return false

          return true
        }).length

        if (!cancelled) setReviewCount(count)
      } catch {
        if (!cancelled) setReviewCount(0)
      }
    }

    compute()
    const id = window.setInterval(compute, 10000)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [route, user?.office, navIsGso, navIsBac, navIsBudget, navIsPto])

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
    <div className="h-dvh overflow-hidden bg-slate-50">
      <div
        className={`grid h-dvh grid-cols-1 ${isSidebarCollapsed ? "lg:grid-cols-[80px_1fr]" : "lg:grid-cols-[260px_1fr]"
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
                <img src="/images/Bataan.png" alt="Bataan" className="size-full object-contain p-1" />
              </div>
              {isSidebarCollapsed ? null : (
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-slate-900">Bataan Capitol DTS</div>
                  <div className="truncate text-xs text-slate-600">{user?.fullName || user?.username || ""}</div>
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
                <LayoutDashboard className="size-4 text-slate-500 group-hover:text-slate-700" />
                {isSidebarCollapsed ? null : "Dashboard"}
              </button>
              {canSeeOfficeRequests ? (
                <button
                  className={navButtonClass(route === "my-documents")}
                  type="button"
                  onClick={() => setRoute("my-documents")}
                  title="Office Requests"
                >
                  <FileStack className="size-4 text-slate-500 group-hover:text-slate-700" />
                  {isSidebarCollapsed ? null : "Office Requests"}
                </button>
              ) : null}
              <button
                className={navButtonClass(route === "all-documents")}
                type="button"
                onClick={() => setRoute("all-documents")}
                title="All Documents"
              >
                <FolderSearch className="size-4 text-slate-500 group-hover:text-slate-700" />
                {isSidebarCollapsed ? null : "All Documents"}
              </button>
              {canUseReview ? (
                <button
                  className={navButtonClass(route === "review")}
                  type="button"
                  onClick={() => setRoute("review")}
                  title="Review"
                >
                  <span className="relative inline-flex items-center">
                    <ClipboardCheck className="size-4 text-slate-500 group-hover:text-slate-700" />
                    {reviewCount > 0 ? (
                      <span className="absolute -right-2 -top-2 min-w-4 rounded-full bg-rose-600 px-1 text-center text-[10px] font-semibold leading-4 text-white">
                        {reviewCount}
                      </span>
                    ) : null}
                  </span>
                  {isSidebarCollapsed ? null : (
                    <span className="flex flex-1 items-center justify-between">
                      <span>Review</span>
                      {reviewCount > 0 ? (
                        <span className="ml-2 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-700">
                          {reviewCount}
                        </span>
                      ) : null}
                    </span>
                  )}
                </button>
              ) : null}
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
                className={navButtonClass(route === "history")}
                type="button"
                onClick={() => setRoute("history")}
                title="History"
              >
                <Clock3 className="size-4 text-slate-500 group-hover:text-slate-700" />
                {isSidebarCollapsed ? null : "History"}
              </button>
              <button
                className={navButtonClass(route === "recently-transferred")}
                type="button"
                onClick={() => setRoute("recently-transferred")}
                title="Recently Transferred"
              >
                <FileText className="size-4 text-slate-500 group-hover:text-slate-700" />
                {isSidebarCollapsed ? null : "Recently Transferred"}
              </button>
              <button
                className={navButtonClass(route === "account-settings")}
                type="button"
                onClick={() => setRoute("account-settings")}
                title="Account Settings"
              >
                <Settings className="size-4 text-slate-500 group-hover:text-slate-700" />
                {isSidebarCollapsed ? null : "Account Settings"}
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

        <div className="flex h-dvh flex-col overflow-hidden">
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

                {canSeeOfficeRequests ? (
                  <button
                    className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap ${route === "my-documents"
                      ? "bg-slate-100 text-slate-900"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      }`}
                    onClick={() => setRoute("my-documents")}
                    type="button"
                  >
                    <FileStack className="size-4" />
                    Office Requests
                  </button>
                ) : null}

                <button
                  className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap ${route === "all-documents"
                    ? "bg-slate-100 text-slate-900"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  onClick={() => setRoute("all-documents")}
                  type="button"
                >
                  <FolderSearch className="size-4" />
                  All Documents
                </button>

                {canUseReview ? (
                  <button
                    className={`relative inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap ${route === "review"
                      ? "bg-slate-100 text-slate-900"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      }`}
                    onClick={() => setRoute("review")}
                    type="button"
                  >
                    <ClipboardCheck className="size-4" />
                    Review
                    {reviewCount > 0 ? (
                      <span className="ml-0.5 rounded-full bg-rose-600 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white">
                        {reviewCount}
                      </span>
                    ) : null}
                  </button>
                ) : null}

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
                  className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap ${route === "history"
                    ? "bg-slate-100 text-slate-900"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  onClick={() => setRoute("history")}
                  type="button"
                >
                  <Clock3 className="size-4" />
                  History
                </button>
                <button
                  className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap ${route === "recently-transferred"
                    ? "bg-slate-100 text-slate-900"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  onClick={() => setRoute("recently-transferred")}
                  type="button"
                >
                  <FileText className="size-4" />
                  Recently Transferred
                </button>
                <button
                  className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap ${route === "account-settings"
                    ? "bg-slate-100 text-slate-900"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  onClick={() => setRoute("account-settings")}
                  type="button"
                >
                  <Settings className="size-4" />
                  Settings
                </button>
              </div>
            </nav>
          </div>

          <main className="w-full flex-1 overflow-auto p-4 lg:p-6">
            {route === "dashboard" ? (
              <div className="w-full space-y-6">
                <ProcurementMyDashboard officeLabel={user?.office || ""} />

                <div className="space-y-3">
                  <ReceivedTransferPage officePrivileges={officePrivileges} transferredToOfficeOnly />
                </div>
              </div>
            ) : route === "my-documents" ? (
              <UserDocuments hideReviewLogsButton />
            ) : route === "all-documents" ? (
              <div className="w-full">
                <AllDocumentsPage title="All Documents" readOnly officePrivileges={officePrivileges} />
              </div>
            ) : route === "review" ? (
              <div className="w-full">
                {canUseReview ? (
                  <ApprovalsPage
                    title="Review"
                    actionMode="logsOnly"
                    logsOnlyActionMode="reviewLogsOnly"
                    officePrivileges={officePrivileges}
                    excludeApprovalProcessed
                    restrictToCurrentOfficeScope
                  />
                ) : (
                  <ProcurementReviewPage officePrivileges={officePrivileges} />
                )}
              </div>
            ) : route === "reports" ? (
              <PlaceholderPanel
                title="Reports"
                description="Generate and export procurement reports here."
              />
            ) : route === "history" ? (
              <div className="w-full space-y-4">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setHistoryView("received-transfer")}
                    className={`inline-flex h-9 items-center justify-center rounded-md px-4 text-sm font-medium transition focus:outline-none focus-visible:outline-none ${historyView === "received-transfer"
                      ? "bg-slate-900 text-white"
                      : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                  >
                    Received / Transfer
                  </button>
                  {isProcurementOffice && hasPrivilege("Request Approval") ? (
                    <button
                      type="button"
                      onClick={() => setHistoryView("approvals")}
                      className={`inline-flex h-9 items-center justify-center rounded-md px-4 text-sm font-medium transition focus:outline-none focus-visible:outline-none ${historyView === "approvals"
                        ? "bg-slate-900 text-white"
                        : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                    >
                      Approvals
                    </button>
                  ) : null}
                </div>

                {historyView === "approvals" && isProcurementOffice && hasPrivilege("Request Approval") ? (
                  <ProcurementReviewPage officePrivileges={officePrivileges} />
                ) : (
                  <ApprovalsPage
                    title="Received / Transfer History"
                    actionMode="logsOnly"
                    logsOnlyActionMode="viewOnly"
                    filterReceivedOnly
                    requireTransferLog
                    officePrivileges={officePrivileges}
                  />
                )}
              </div>
            ) : route === "recently-transferred" ? (
              <div className="w-full">
                <ProcurementRecentlyTransferred officePrivileges={officePrivileges} />
              </div>
            ) : (
              <UserProfile user={user} />
            )}
          </main>
        </div>
      </div>
    </div>
  )
}