import Barcode from "react-barcode"

import type { PrTemplateModel } from "../admin/pages/SettingsPage"

export type { PrTemplateModel }

function HeaderBarcode({ trackingNo }: { trackingNo?: string }) {
  const barcodeValue = String(trackingNo || "").trim()
  if (!barcodeValue) return null

  return (
    <div style={{ display: "flex", justifyContent: "flex-end" }}>
      <Barcode
        value={barcodeValue}
        format="CODE128"
        width={1.35}
        height={32}
        displayValue={true}
        fontSize={10}
        margin={0}
      />
    </div>
  )
}

function shouldShowBarcode(model: PrTemplateModel): boolean {
  const logs = Array.isArray(model.logs) ? model.logs : []
  const statusLower = String(model.status || '').trim().toLowerCase()

  // Always show once the document has reached Budget or PTO (admin approval path)
  if (statusLower === 'in-budget' || statusLower === 'in-pto') return true

  // Also show if any log indicates a transfer to Budget or PTO (covers legacy labels too)
  const hasTransferToBudgetOrPto = logs.some((l) => {
    const label = String(l?.label || '').trim().toLowerCase()
    return (
      label.includes('transferred to budget') ||
      label.includes('transferred to pto') ||
      // legacy: "Approved: Transferred to Budget (...)"
      /approved[:\s]+transferred\s+to\s+(budget|pto)/i.test(label)
    )
  })
  if (hasTransferToBudgetOrPto) return true

  // Helper to check if an office has approved
  const hasApproved = (officeNeedle: string) => {
    const needle = officeNeedle.toLowerCase()
    return logs.some((l) => {
      const label = String(l?.label || '').trim().toLowerCase()
      const byOffice = String(l?.byOffice || '').trim().toLowerCase()
      if (!label.startsWith('approved')) return false
      return byOffice.includes(needle) || label.includes(needle)
    })
  }

  // OBR only: need BAC approval
  if (model.hasObr && !model.hasPr) {
    return hasApproved('bac')
  }

  // PR only or PR+OBR: need both GSO and BAC approval
  if (model.hasPr) {
    return hasApproved('gso') && hasApproved('bac')
  }

  // Default: show if document is approved/completed
  return statusLower === 'approved' || statusLower === 'completed'
}

export function PrTemplatePreview({
  model,
  activePage = 0,
  forceShowAllPages = false,
}: {
  model: PrTemplateModel
  activePage?: number
  forceShowAllPages?: boolean
}) {
  const items = Array.isArray(model.items) ? model.items : []
  const PR_PAGE_BREAK_MARKER = "__PR_PAGE_BREAK__"

  const safeNumber = (raw: string) => {
    const s = String(raw || "").trim()
    if (!s) return 0
    const cleaned = s.replace(/[^0-9.,-]/g, "").replace(/,/g, "")
    const n = Number.parseFloat(cleaned)
    return Number.isFinite(n) ? n : 0
  }

  const formatMoney = (n: number) =>
    new Intl.NumberFormat("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)

  const formatPeso = (n: number) => `₱ ${formatMoney(n)}`

  const computedGrandTotal = items.reduce((sum, it) => {
    const total = safeNumber(it.totalCost)
    if (total > 0) return sum + total
    return sum + safeNumber(it.quantity) * safeNumber(it.unitCost)
  }, 0)

  const firstPageCapacity = 25
  const nextPageCapacity = 25

  const pages: typeof items[] = (() => {
    const hasMarkers = items.some((it) => String(it?.description || "").trim() === PR_PAGE_BREAK_MARKER)
    if (hasMarkers) {
      const acc: typeof items[] = [[]]
      for (const it of items) {
        const isMarker = String(it?.description || "").trim() === PR_PAGE_BREAK_MARKER
        if (isMarker) {
          acc.push([])
        } else {
          acc[acc.length - 1].push(it)
        }
      }
      return acc.length ? acc : [items.filter((it) => String(it?.description || "").trim() !== PR_PAGE_BREAK_MARKER)]
    }

    if (items.length <= firstPageCapacity) return [items]
    const first = items.slice(0, firstPageCapacity)
    const rest = items.slice(firstPageCapacity)
    const nextPages = Array.from({ length: Math.ceil(rest.length / nextPageCapacity) }).map((_, idx) =>
      rest.slice(idx * nextPageCapacity, idx * nextPageCapacity + nextPageCapacity)
    )
    return [first, ...nextPages]
  })()

  const pageCount = pages.length

  const computeItemTotal = (it: (typeof items)[number]) => {
    const total = safeNumber(it.totalCost)
    if (total > 0) return total
    return safeNumber(it.quantity) * safeNumber(it.unitCost)
  }

  return (
    <div className="w-full box-border print-no-space">
      <div className="w-full flex flex-col items-center print-no-space pr-pages-wrapper">
        {pages.map((pageItems, pageIndex) => {
          const prevTotal = pages
            .slice(0, pageIndex)
            .reduce((sum, pg) => sum + pg.reduce((s2, it) => s2 + computeItemTotal(it), 0), 0)
          const pageSubTotal = pageItems.reduce((sum, it) => sum + computeItemTotal(it), 0)
          const isLastPage = pageIndex === pageCount - 1

          const itemRowCount = 25
          const totalRowIndex = itemRowCount

          const isVisible = forceShowAllPages || pageIndex === activePage

          return (
            <div
              key={pageIndex}
              className={`print-page bg-white relative w-[816px] h-[1056px] overflow-hidden mx-auto p-3 print-no-mt ${isVisible ? "" : "hidden"}`}
              style={{
                fontFamily: "Times New Roman, Times, serif",
                breakAfter: pageIndex === pageCount - 1 ? "auto" : "page",
                pageBreakAfter: pageIndex === pageCount - 1 ? "auto" : "always",
              }}
            >
              <div className="absolute top-1 right-2 text-[12px] italic">Appendix 47</div>

              {pageIndex === 0 ? (
                <div className="absolute top-7 right-4 z-20 bg-white origin-top-right scale-90">
                  {shouldShowBarcode(model) ? (
                    <HeaderBarcode trackingNo={model.trackingNo} />
                  ) : null}
                </div>
              ) : null}

              <div className="mt-3 h-[calc(100%-12px)] w-full border border-black bg-white px-4 pb-8 pt-6 relative">
                <h3 className="text-center text-xl font-bold uppercase tracking-wide">PURCHASE REQUEST</h3>
                <div className="mt-1 flex items-center text-[12px] font-bold">
                  <span>
                    LGU: <span className="underline">PROVINCIAL GOVERNMENT OF BATAAN</span>
                  </span>
                  <span className="ml-auto mr-36">FUND: {model.fund || ""}</span>
                </div>

                <div className="mt-2 border border-black min-h-[650px] p-0 pr-table">
                  <div className="grid grid-cols-[140px_1fr_120px] text-[12px] font-bold text-black">
                    <div className="border-r border-black px-2 py-1">Department: {model.department || ""}</div>
                    <div className="px-2 py-1">
                      <span>PR No.:</span>
                      {model.prNo ? (
                        <span className="text-blue-600 font-bold ml-1.5">
                          {model.prNo.replace(/^PR\s*No\.?\s*:?\s*/i, "")}
                        </span>
                      ) : null}
                    </div>
                    <div className="px-2 py-1">Date: {model.date || ""}</div>
                  </div>
                  <div className="grid grid-cols-[140px_1fr_120px] border-b border-black text-[12px] font-bold">
                    <div className="border-r border-black px-2 py-1">Section: {model.section || ""}</div>
                    <div className="px-2 py-1">FPP: {model.fpp || ""}</div>
                    <div className="p-1" />
                  </div>

                  <div className="grid grid-cols-[80px_60px_1fr_70px_80px_80px] border-b border-black text-[12px] font-bold text-center">
                    <div className="border-r border-black py-1">Item No.</div>
                    <div className="border-r border-black py-1">Unit</div>
                    <div className="border-r border-black py-1">Item Description</div>
                    <div className="border-r border-black py-1">Quantity</div>
                    <div className="border-r border-black py-1">Unit Cost</div>
                    <div className="py-1">Total Cost</div>
                  </div>

                  {Array.from({ length: itemRowCount + 1 }).map((_, rowIndex) => {
                    const isTotalRow = rowIndex === totalRowIndex
                    const isCarryRow = pageIndex > 0 && rowIndex === 0

                    const pageItemIndex = pageIndex > 0 ? rowIndex - 1 : rowIndex
                    const row = !isTotalRow && !isCarryRow ? pageItems[pageItemIndex] : null
                    const rowHasUnit = row ? Boolean(String(row.unit || "").trim()) : false
                    const rowTotal = row ? computeItemTotal(row) : 0

                    const autoItemNo = rowHasUnit
                      ? String(
                        pageItems
                          .slice(0, pageItemIndex + 1)
                          .filter((it) => String(it.unit || "").trim()).length,
                      )
                      : ""

                    const displayItemNo = isTotalRow || isCarryRow || !rowHasUnit ? "" : autoItemNo

                    return (
                      <div
                        key={rowIndex}
                        className="grid grid-cols-[80px_60px_1fr_70px_80px_80px] border-b border-black last:border-b-0"
                      >
                        <div className="border-r border-black min-h-[24px] px-2 flex items-center justify-center text-[11px] font-normal pt-0.5 pb-0.5 whitespace-pre-wrap break-words">
                          {displayItemNo}
                        </div>
                        <div className="border-r border-black min-h-[24px] px-2 flex items-center justify-center text-[11px] font-normal pt-0.5 pb-0.5 whitespace-pre-wrap break-words">
                          {isTotalRow || isCarryRow ? "" : row?.unit || ""}
                        </div>
                        <div
                          className={`border-r border-black min-h-[24px] px-2 flex items-center ${isTotalRow ? "justify-center font-bold text-[13px]" : isCarryRow ? "justify-center font-bold text-[11px]" : "text-[11px] font-normal"} pt-0.5 pb-0.5 whitespace-pre-wrap break-words leading-tight`}
                        >
                          {isTotalRow ? (isLastPage ? "TOTAL" : "SUB-TOTAL") : isCarryRow ? "BALANCED FORWARDED" : row?.description || ""}
                        </div>
                        <div className="border-r border-black min-h-[24px] px-2 flex items-center justify-center text-[11px] font-normal pt-0.5 pb-0.5 whitespace-pre-wrap break-words">
                          {isTotalRow || isCarryRow ? "" : row?.quantity || ""}
                        </div>
                        <div className="border-r border-black min-h-[24px] px-2 flex items-center justify-center text-[11px] font-normal pt-0.5 pb-0.5 whitespace-pre-wrap break-words">
                          {isTotalRow || isCarryRow ? "" : row?.unitCost || ""}
                        </div>
                        <div className={`min-h-[24px] px-2 flex items-center justify-center text-[11px] ${isTotalRow ? "font-bold" : "font-normal"} pt-0.5 pb-0.5 whitespace-nowrap`}>
                          {isTotalRow
                            ? formatPeso(isLastPage ? computedGrandTotal : prevTotal + pageSubTotal)
                            : isCarryRow
                              ? prevTotal
                                ? formatPeso(prevTotal)
                                : ""
                              : row
                                ? row.totalCost
                                  ? `₱ ${String(row.totalCost).replace(/[^0-9.,-]/g, "").trim()}`
                                  : rowTotal
                                    ? formatPeso(rowTotal)
                                    : ""
                                : ""}
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="mt-1 text-[13px] px-2 leading-tight">
                  <span className="font-bold">Purpose:</span> {model.purpose || ""}
                </div>

                <div className="h-6" />

                <div className="border border-black p-0 mb-4">
                  <div className="grid grid-cols-[80px_1fr_1fr_1fr] text-[12px]">
                    <div className="border-r border-black row-span-5 whitespace-nowrap p-1 flex flex-col justify-end leading-tight">
                      <div className="text-left">Signature:</div>
                      <div className="text-left">Printed Name:</div>
                      <div className="text-left">Designation:</div>
                    </div>

                    <div className="border-r border-black py-1 text-center">Requested by:</div>
                    <div className="border-r border-black py-1 text-center">Cash Availability:</div>
                    <div className="py-1 text-center">Approved by:</div>

                    <div className="border-r border-b border-black row-span-2 h-8" />
                    <div className="border-r border-b border-black row-span-2 h-8" />
                    <div className="border-b border-black row-span-2 h-8" />

                    <div className="border-r border-black h-7 text-center text-[12px] font-bold flex items-center justify-center whitespace-nowrap px-2">
                      {model.requestedByName || ""}
                    </div>
                    <div className="border-r border-black h-7 text-center text-[12px] font-bold flex items-center justify-center whitespace-nowrap px-2">
                      {String(model.cashAvailabilityName || "").trim() || "ALICIA R. MAGPANTAY"}
                    </div>
                    <div className="h-7 text-center text-[12px] font-bold flex items-center justify-center whitespace-nowrap px-2">
                      {String(model.approvedByName || "").trim() || "JOSE ENRIQUE S. GARCIA III"}
                    </div>

                    <div className="border-r border-black h-6 text-center text-[12px] flex items-center justify-center px-2">
                      {model.requestedByDesignation || ""}
                    </div>
                    <div className="border-r border-black h-6 text-center text-[12px] flex items-center justify-center px-2">
                      {String(model.cashAvailabilityDesignation || "").trim() || "Provincial Treasurer"}
                    </div>
                    <div className="h-6 text-center text-[12px] flex items-center justify-center px-2">
                      {String(model.approvedByDesignation || "").trim() || "Provincial Governor"}
                    </div>
                  </div>
                </div>

                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[12px] leading-none font-bold">
                  {`${pageIndex + 1} of ${pageCount}`}
                </div>
              </div>

            </div>
          )
        })}
      </div>
    </div>
  )
}

export default PrTemplatePreview
