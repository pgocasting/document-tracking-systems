import { useCallback, useEffect, useMemo, useState } from "react"
import { History } from "lucide-react"
import { toast } from "../../lib/toast"
import { formatLogRemarks } from "../../utils/formatLogRemarks"

const RAW_API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000/api"
const API_URL = RAW_API_URL.replace(/\/$/, "").endsWith("/api")
  ? RAW_API_URL.replace(/\/$/, "")
  : `${RAW_API_URL.replace(/\/$/, "")}/api`

// ─── Types ────────────────────────────────────────────────────────────────────

type DocLog = {
  label?: string
  color?: string
  byOffice?: string
  byUser?: string
  createdAt?: string | number | Date
}

type SubDocument = {
  trackingNo: string
  purpose: string
  amount: string
  supplier?: string
  status: string
  logs?: DocLog[]
}

type ApiDoc = {
  _id: string
  trackingNo: string
  createdBy: string
  office?: string
  fund?: string
  prEnabled?: boolean
  obrEnabled?: boolean
  prNo?: string
  obrNo?: string
  purpose: string
  amount?: string
  status?: string
  driveLink?: string
  logs?: DocLog[]
  createdAt?: string
  subDocuments?: SubDocument[]
}

type ReviewRow = {
  id: string            // doc._id or sub identifier
  trackingNo: string
  requestor: string
  prRef: string
  obrRef: string
  createdBy: string
  purpose: string
  supplier: string
  obrAvail: boolean
  prAvail: boolean
  driveLink: string
  sourceOfFund: string
  amount: string
  rawLogs: DocLog[]
  // back-reference to the parent doc
  doc: ApiDoc
  isSubDocument: boolean
  subDocIndex: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getUserInfo() {
  try {
    const raw = localStorage.getItem("user")
    const parsed = raw ? (JSON.parse(raw) as { office?: string; fullName?: string; username?: string; role?: string } | null) : null
    return {
      office: String(parsed?.office || "").trim(),
      fullName: String(parsed?.fullName || parsed?.username || "").trim(),
      role: String(parsed?.role || "").trim(),
    }
  } catch {
    return { office: "", fullName: "", role: "" }
  }
}

function normalizeOffice(raw: string) {
  return String(raw || "").trim().toLowerCase()
}

/** Does the doc (or any sub-doc) have an approval/return action by the given office? */
function hasApprovalLogByOffice(logs: DocLog[], officeLower: string) {
  if (!officeLower) return false

  for (let i = logs.length - 1; i >= 0; i -= 1) {
    const l = logs[i];
    if (!l) continue;

    const labelLower = String(l?.label || "").trim().toLowerCase()

    // If we see a "remarks:" log before seeing any approval log, 
    // it means the end-user has resubmitted or commented and we need to re-review it!
    if (labelLower.startsWith("remarks:") || labelLower.startsWith("remarks ")) {
      return false
    }

    if (labelLower.startsWith("transferred to")) {
      const destMatch = labelLower.match(/transferred to\s+([^(:]+)/i)
      if (destMatch) {
        const destStr = normalizeOffice(destMatch[1])
        if (destStr === officeLower || destStr.includes(officeLower) || officeLower.includes(destStr)) {
          return false
        }
      }
      continue
    }

    const byOfficeLower = normalizeOffice(l?.byOffice || "")
    const isApprovalLabel = labelLower.includes("approved") || labelLower.includes("returned")
    if (!isApprovalLabel) continue

    if (byOfficeLower) {
      if (byOfficeLower === officeLower || byOfficeLower.includes(officeLower) || officeLower.includes(byOfficeLower)) {
        return true
      }
    } else {
      // Fallback: label starts with office name
      if (labelLower.startsWith(`${officeLower}:`)) return true
      const startsWithOffice = labelLower.startsWith(`${officeLower} `)
      if (startsWithOffice) return true
    }
  }

  return false
}

function formatAmount(raw: string | undefined) {
  const cleaned = String(raw || "").replace(/[^0-9.,-]/g, "").trim()
  return cleaned ? `₱ ${cleaned}` : "-"
}

function formatDate(raw: string | number | Date | undefined) {
  if (!raw) return "-"
  const d = new Date(raw as string)
  return isNaN(d.getTime()) ? "-" : d.toLocaleString()
}

// ─── Main Component ───────────────────────────────────────────────────────────

type Props = {
  officePrivileges?: string[]
}

export default function ProcurementReviewPage({ officePrivileges: _officePrivileges }: Props) {
  const [rows, setRows] = useState<ReviewRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [pageSize, setPageSize] = useState(10)

  // Modal state
  const [logsRow, setLogsRow] = useState<ReviewRow | null>(null)
  const [remarksType, setRemarksType] = useState<"return" | "approve">("return")
  const [remarks, setRemarks] = useState("")
  const [submitBusy, setSubmitBusy] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const { office } = useMemo(() => getUserInfo(), [])
  const officeLower = normalizeOffice(office)

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchRows = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const token = localStorage.getItem("token")
      const res = await fetch(`${API_URL}/documents`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error("Failed to fetch documents")
      const data = (await res.json()) as { documents: ApiDoc[] }
      const docs = Array.isArray(data.documents) ? data.documents : []

      const result: ReviewRow[] = []

      docs.forEach((doc) => {
        const statusLower = String(doc.status || "").trim().toLowerCase()

        // Procurement Review page should only list parent documents that are in
        // end-user pre-validation. Sub-documents may already be ongoing and must not
        // appear on this page.
        if (statusLower !== "pre-validation") return

          ; ([doc] as unknown as SubDocument[]).forEach((item, idx) => {
            const isSub = false
            const logsRaw: DocLog[] = Array.isArray(doc.logs) ? doc.logs : []

            // Only include if this office has touched the doc (approved or returned)
            if (!hasApprovalLogByOffice(logsRaw, officeLower)) return

            result.push({
              id: isSub ? `${doc._id}-sub-${idx}` : doc._id,
              trackingNo: isSub ? item.trackingNo : doc.trackingNo,
              requestor: doc.office || "-",
              prRef: doc.prEnabled === false ? "Not Available" : "Available",
              obrRef: doc.obrEnabled === false ? "Not Available" : "Available",
              createdBy: doc.createdBy || "-",
              purpose: item.purpose || doc.purpose || "-",
              supplier: (item as any).supplier || (doc as any).supplier || "-",
              obrAvail: doc.obrEnabled !== false,
              prAvail: doc.prEnabled !== false,
              driveLink: doc.driveLink || "",
              sourceOfFund: doc.fund || "-",
              amount: formatAmount(item.amount ?? doc.amount),
              rawLogs: logsRaw,
              doc,
              isSubDocument: isSub,
              subDocIndex: idx,
            })
          })
      })

      setRows(result)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load documents")
    } finally {
      setLoading(false)
    }
  }, [officeLower])

  useEffect(() => {
    fetchRows()
  }, [fetchRows])

  // Real-time refresh via socket
  const handleDocChange = useCallback(() => {
    void fetchRows()
  }, [fetchRows])

  const { office: userOffice } = getUserInfo()
  useDocumentSocket(
    { userId: userOffice, office: userOffice, role: "procurement" },
    handleDocChange
  )

  // ── Filter / Paginate ──────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return rows
    return rows.filter(
      (r) =>
        r.trackingNo.toLowerCase().includes(q) ||
        r.requestor.toLowerCase().includes(q) ||
        r.createdBy.toLowerCase().includes(q) ||
        r.purpose.toLowerCase().includes(q) ||
        r.supplier.toLowerCase().includes(q)
    )
  }, [rows, query])

  const visible = useMemo(() => filtered.slice(0, pageSize), [filtered, pageSize])

  // ── Open / Close modal ─────────────────────────────────────────────────────

  function openLogsModal(row: ReviewRow) {
    setLogsRow(row)
    setRemarksType("return")
    setRemarks("")
    setSubmitError(null)
  }

  function closeLogsModal() {
    setLogsRow(null)
    setRemarksType("return")
    setRemarks("")
    setSubmitError(null)
  }

  // ── Logs for modal (most-recent-first) ────────────────────────────────────

  const modalLogs = useMemo(() => {
    if (!logsRow) return []
    return [...logsRow.rawLogs]
      .reverse()
      .map((l) => ({
        createdAt: l.createdAt,
        byUser: String(l.byUser || "").trim(),
        byOffice: String(l.byOffice || "").trim(),
        label: String(l.label || "").trim(),
        color: l.color,
      }))
      .filter((l) => Boolean(l.label))
  }, [logsRow])

  // ── Submit review remark ───────────────────────────────────────────────────

  async function handleSubmit() {
    if (!logsRow) return
    const trimmed = remarks.trim()
    if (!trimmed) {
      setSubmitError("Please enter remarks.")
      toast.error("Please enter remarks.")
      return
    }

    const { office: byOffice, fullName: byUser } = getUserInfo()
    const prefix = remarksType === "approve" ? "Approved" : "Returned"
    const label = `${prefix}: ${trimmed}`
    const color = remarksType === "approve" ? "bg-emerald-600" : "bg-rose-600"
    const newLog: DocLog = {
      label,
      color,
      byOffice,
      byUser,
      createdAt: new Date().toISOString(),
    }

    try {
      setSubmitBusy(true)
      setSubmitError(null)
      const token = localStorage.getItem("token")
      const doc = logsRow.doc

      if (logsRow.isSubDocument) {
        const currentSubs: SubDocument[] = Array.isArray(doc.subDocuments)
          ? [...doc.subDocuments]
          : []
        const idx = logsRow.subDocIndex
        const target = { ...(currentSubs[idx] || {}) } as SubDocument
        target.logs = [...(Array.isArray(target.logs) ? target.logs : []), newLog]
        currentSubs[idx] = target

        const res = await fetch(`${API_URL}/documents/${doc._id}`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ subDocuments: currentSubs }),
        })
        if (!res.ok) throw new Error(await res.text())
      } else {
        const res = await fetch(`${API_URL}/documents/${doc._id}`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ addLog: { label, color, byOffice, byUser } }),
        })
        if (!res.ok) throw new Error(await res.text())
      }

      setRemarks("")
      setRemarksType("return")
      closeLogsModal()
      await fetchRows()
      toast.success("Review log submitted successfully.")
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Failed to submit")
      toast.error(e instanceof Error ? e.message : "Failed to submit")
    } finally {
      setSubmitBusy(false)
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-700 ring-1 ring-inset ring-blue-700/10">
              The Bunker &bull; Bataan Capitol DTS
            </span>
          </div>
          <div className="mt-1 text-lg font-bold tracking-tight text-slate-900">Approvals & Review History</div>
          <div className="text-xs text-slate-500">Official log of documents and purchase requests reviewed by your office</div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-slate-500" htmlFor="pr-entries">Show</label>
            <select
              id="pr-entries"
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="h-9 rounded-lg border border-slate-200 border-l-[3px] border-l-blue-500 bg-slate-50/80 px-2.5 text-xs font-semibold text-slate-800 transition focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {[10, 25, 50, 100].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            <span className="text-xs font-medium text-slate-500">entries</span>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-slate-500" htmlFor="pr-search">Search:</label>
            <input
              id="pr-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-9 w-full min-w-52 rounded-lg border border-slate-200 border-l-[3px] border-l-blue-500 bg-slate-50/80 px-3 text-xs text-slate-900 placeholder:text-slate-400 transition focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              placeholder="Tracking, requestor, purpose..."
            />
          </div>
        </div>
      </div>

      {/* Error */}
      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 font-medium">{error}</div>
      ) : null}

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="overflow-auto">
          {loading ? (
            <div className="p-8 text-center text-sm text-slate-500">Loading...</div>
          ) : (
            <table className="w-full min-w-[900px] text-left text-sm border-collapse border border-slate-200 [&_th]:border [&_th]:border-blue-700 [&_td]:border [&_td]:border-slate-200">
              <thead className="bg-blue-600 text-white">
                <tr className="border-b border-blue-700">
                  <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-white">Timestamp</th>
                  <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-white">Tracking #</th>
                  <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-white">Requestor</th>
                  <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-white">References</th>
                  <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-white">Created By</th>
                  <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-white">Purpose</th>
                  <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-white">Supplier</th>
                  <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-white">Attachments</th>
                  <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-white">Source of Fund</th>
                  <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-white">Amount</th>
                  <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-white">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visible.length === 0 ? (
                  <tr>
                    <td className="px-4 py-10 text-center text-sm text-slate-500" colSpan={11}>
                      No records found.
                    </td>
                  </tr>
                ) : (
                  visible.map((r) => {
                    // get created date from logs or doc
                    const firstLog = r.rawLogs[0]
                    const ts = firstLog?.createdAt
                      ? formatDate(firstLog.createdAt)
                      : r.doc.createdAt
                        ? formatDate(r.doc.createdAt)
                        : "-"

                    // Last review action by this office
                    const lastReviewLog = [...r.rawLogs].reverse().find((l) => {
                      const lbl = String(l.label || "").toLowerCase()
                      const byO = normalizeOffice(l.byOffice || "")
                      const isAction = lbl.includes("approved") || lbl.includes("returned")
                      const isThisOffice = byO === officeLower || byO.includes(officeLower) || officeLower.includes(byO)
                      return isAction && isThisOffice
                    })
                    const isApproved = String(lastReviewLog?.label || "").toLowerCase().includes("approved")
                    const isReturned = String(lastReviewLog?.label || "").toLowerCase().includes("returned")

                    return (
                      <tr key={r.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 align-top text-xs text-slate-600 whitespace-nowrap">{ts}</td>
                        <td className="px-4 py-3 align-top">
                          <span className="font-medium text-sky-700">{r.trackingNo}</span>
                        </td>
                        <td className="px-4 py-3 align-top text-slate-700">{r.requestor}</td>
                        <td className="px-4 py-3 align-top">
                          <div className="flex flex-col gap-1">
                            <span className="text-xs text-slate-600">PR: {r.prRef}</span>
                            <span className="text-xs text-slate-600">OBR: {r.obrRef}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 align-top text-slate-700">{r.createdBy}</td>
                        <td className="px-4 py-3 align-top max-w-[200px]">
                          <span className="line-clamp-2 text-slate-700" title={r.purpose}>{r.purpose}</span>
                        </td>
                        <td className="px-4 py-3 align-top text-slate-700">{r.supplier || "-"}</td>
                        <td className="px-4 py-3 align-top">
                          <div className="flex flex-col gap-1">
                            <span
                              className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-semibold ${r.obrAvail ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-500"}`}
                            >
                              OBR
                            </span>
                            <span
                              className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-semibold ${r.prAvail ? "bg-sky-600 text-white" : "bg-slate-200 text-slate-500"}`}
                            >
                              PR
                            </span>
                            {r.driveLink ? (
                              <a
                                href={r.driveLink}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center rounded bg-amber-400 px-2 py-0.5 text-[10px] font-semibold text-slate-900 hover:bg-amber-300"
                              >
                                Link
                              </a>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-4 py-3 align-top text-slate-700">{r.sourceOfFund}</td>
                        <td className="px-4 py-3 align-top text-slate-700 whitespace-nowrap">{r.amount}</td>
                        <td className="px-4 py-3 align-top">
                          <div className="flex flex-col gap-1">
                            {/* Status badge (last review action) */}
                            {lastReviewLog ? (
                              <span
                                className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-semibold ${isApproved ? "bg-emerald-600 text-white" : isReturned ? "bg-rose-600 text-white" : "bg-slate-200 text-slate-700"}`}
                              >
                                {isApproved ? "Approved" : isReturned ? "Returned" : "Reviewed"}
                              </span>
                            ) : null}
                            <button
                              type="button"
                              onClick={() => openLogsModal(r)}
                              className="inline-flex h-8 items-center justify-center rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-900 shadow-sm transition hover:bg-slate-50 focus:outline-none focus-visible:outline-none"
                            >
                              Review Logs
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Review Logs Modal ─────────────────────────────────────────────────── */}
      {logsRow ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => {
            if (e.currentTarget === e.target) closeLogsModal()
          }}
        >
          <div className="flex max-h-[90dvh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            {/* Modal header */}
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/50 px-5 py-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <History className="size-4 text-emerald-600" />
                  <h3 className="truncate text-base font-bold text-slate-900">Review Logs</h3>
                </div>
                <div className="mt-0.5 truncate text-xs font-medium text-slate-500">
                  Tracking No: <span className="text-slate-900">{logsRow.trackingNo}</span> — <span className="text-slate-700">{logsRow.requestor}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={closeLogsModal}
                className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 focus:outline-none"
                aria-label="Close"
              >
                <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal body */}
            <div className="flex-1 overflow-auto p-5">
              {/* Logs table */}
              <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
                <table className="w-full text-left text-sm border-collapse border border-slate-200 [&_th]:border [&_th]:border-blue-700 [&_td]:border [&_td]:border-slate-200">
                  <thead className="bg-blue-600 text-white border-b border-blue-700">
                    <tr>
                      <th className="w-32 px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-white">Timestamp</th>
                      <th className="w-40 px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-white">User</th>
                      <th className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-white">Remarks</th>
                      <th className="w-24 px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-white text-right">Office</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {modalLogs.length === 0 ? (
                      <tr>
                        <td className="px-4 py-10 text-center text-sm text-slate-400" colSpan={4}>
                          No activity logs found for this document.
                        </td>
                      </tr>
                    ) : (
                      modalLogs.map((l, idx) => {
                        const bg = String(l.color || 'bg-sky-500')
                        const processedBy = l.byUser || l.byOffice || "-"
                        const dateRaw = l.createdAt ? new Date(l.createdAt) : null
                        const dateText = dateRaw && Number.isFinite(dateRaw.getTime())
                          ? dateRaw.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                          : "-"
                        const timeText = dateRaw && Number.isFinite(dateRaw.getTime())
                          ? dateRaw.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: true })
                          : "-"

                        return (
                          <tr key={idx} className={`${bg} text-white`}>
                            <td className="px-4 py-3 align-top">
                              <div className="flex flex-col gap-0.5">
                                <span className="font-bold tracking-tight">{dateText}</span>
                                <span className="text-[10px] opacity-80 font-medium uppercase">{timeText}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 align-top">
                              <div className="text-xs font-bold leading-tight uppercase">{processedBy}</div>
                            </td>
                            <td className="px-4 py-3 align-top text-xs font-medium leading-relaxed">
                              {formatLogRemarks(l.label)}
                            </td>
                            <td className="px-4 py-3 align-top text-right">
                              <span className="inline-flex rounded bg-black/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide">
                                {String(l.byOffice || '-').toUpperCase()}
                              </span>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Legends */}
              <div className="mt-6 flex items-center justify-end gap-5 pt-2">
                <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <span className="size-2.5 rounded-full bg-emerald-600" />
                  Approved
                </div>
                <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <span className="size-2.5 rounded-full bg-rose-600" />
                  Returned
                </div>
                <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <span className="size-2.5 rounded-full bg-sky-600" />
                  Process
                </div>
              </div>

              {/* Action Section */}
              <div className="mt-8 space-y-6 border-t border-slate-100 pt-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Remarks Type</div>
                    <select
                      value={remarksType}
                      onChange={(e) => setRemarksType(e.target.value as "return" | "approve")}
                      aria-label="Remarks Type"
                      className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                    >
                      <option value="return">Return to End-User</option>
                      <option value="approve">Approve Document</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Remarks</div>
                    <textarea
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      aria-label="Remarks"
                      placeholder="Enter remarks..."
                      rows={1}
                      className="w-full min-h-[40px] resize-none rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Submit error */}
                {submitError ? (
                  <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-bold text-rose-700">
                    {submitError}
                  </div>
                ) : null}
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 p-5">
              <button
                type="button"
                onClick={closeLogsModal}
                className="h-10 rounded-xl border border-slate-300 bg-white px-5 text-sm font-bold text-slate-600 transition hover:bg-slate-100 active:scale-95"
              >
                Close
              </button>
              <button
                type="button"
                disabled={submitBusy}
                onClick={handleSubmit}
                className="h-10 rounded-xl bg-emerald-600 px-8 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 active:scale-95 disabled:scale-100 disabled:opacity-50"
              >
                {submitBusy ? "Submitting…" : "Submit Action"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
