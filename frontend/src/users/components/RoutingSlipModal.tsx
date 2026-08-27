import { Printer } from "lucide-react"
import type { DocumentRow } from "../types/documentTypes"

type RoutingSlipModalProps = {
  rsDoc: DocumentRow | null
  onClose: () => void
}

export default function RoutingSlipModal({ rsDoc, onClose }: RoutingSlipModalProps) {
  if (!rsDoc) return null

  const handleGenerateRoutingSlip = () => {
    if (!rsDoc) return
    const slip = String(rsDoc.gsoRoutingSlip || "").trim()
    const printWin = window.open("", "_blank", "width=1200,height=800")
    if (!printWin) {
      window.alert("Please allow pop-ups to generate the routing slip.")
      return
    }

    const amount = rsDoc.amount ? rsDoc.amount : ""
    const office = rsDoc.office || ""
    const particulars = rsDoc.purpose || ""
    const categoryTitle = slip ? slip.toUpperCase() : "GOODS &amp; SERVICES"

    // Per-category config
    const slipUpper = slip.toUpperCase()
    let formNo = "GSO-PRP-F03"
    let revisionNo = "02"
    let lastRowLabel = "Routing"
    let focalPerson = slip || "Meals and Events"
    let requirementItems: string[] = []

    if (slipUpper.includes("MEALS") || slipUpper.includes("EVENTS")) {
      formNo = "GSO-PRP-F03"; revisionNo = "02"; lastRowLabel = "Routing"; focalPerson = "Meals and Events"
      requirementItems = [
        "Obligation Request", "Purchase Request",
        "List of recipients of tokens (if applicable)",
        "Layout (Tarpaulin, if applicable)",
        "Notification Letter (if applicable)",
        "Project Proposal / Program Design (if applicable)",
      ]
    } else if (slipUpper.includes("IT") || slipUpper.includes("EQUIPMENT")) {
      formNo = "GSO-PRP-F02"; revisionNo = "01"; lastRowLabel = "Routing Slip No.:"; focalPerson = "IT and Equipment"
      requirementItems = [
        "Obligation Request", "Purchase Request",
        "Picture (for non-common items, if applicable)",
        "Request Letter (if applicable)",
        "Condemnation Letter (if applicable)",
        "Pre-inspection Report (if applicable)",
        "Costing (if applicable)",
        "ICT Recommendation from MIS (for IT)",
      ]
    } else if (slipUpper.includes("GOODS") || slipUpper.includes("SERVICES")) {
      formNo = "GSO-PRP-F04"; revisionNo = "01"; lastRowLabel = "Routing Slip No.:"; focalPerson = "Goods and Services"
      requirementItems = [
        "Obligation Request", "Purchase Request",
        "Project Proposal (if applicable)",
        "Request Letter (if applicable)",
        "Pre-repair inspection and Evaluation Report (if applicable)",
        "Cost estimate (if applicable)",
      ]
    } else if (slipUpper.includes("REPAIR") || slipUpper.includes("MOTOR") || slipUpper.includes("MAINTENANCE")) {
      formNo = "GSO-PRP-F05"; revisionNo = "02"; lastRowLabel = "Routing Slip No.:"; focalPerson = "Repair and Maintenance"
      requirementItems = [
        "Obligation Request",
        "Purchase Request",
        "Pre-repair Inspection Report indicating last repair (if applicable)",
      ]
    } else {
      requirementItems = [
        "Obligation Request", "Purchase Request",
        "List of recipients of tokens (if applicable)",
        "Layout (Tarpaulin, if applicable)",
        "Notification Letter (if applicable)",
        "Project Proposal / Program Design (if applicable)",
      ]
    }

    const requirementsHTML = requirementItems.map((item, i) =>
      `<li><span class="cb"></span><span><sup>${i + 1}.</sup>${item}</span></li>`
    ).join("")

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Routing Slip – ${rsDoc.trackingNo}</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: Arial, sans-serif; font-size: 8pt; color: #000; padding: 8px 12px; }
            .page-wrap { display: flex; gap: 16px; align-items: flex-start; width: 100%; }
            .form-col { flex: 1; min-width: 0; }
            .divider { width: 1px; background: #aaa; align-self: stretch; flex-shrink: 0; }
            .form-ref { display: flex; justify-content: flex-end; font-size: 7pt; margin-bottom: 2px; gap: 14px; }
            .form-title { text-align: center; font-weight: bold; font-size: 8.5pt; margin-bottom: 4px; line-height: 1.3; }
            .form-subtitle { text-align: center; font-weight: bold; font-size: 8pt; text-decoration: underline; margin-bottom: 6px; }
            
            .rs-table { width: 100%; border-collapse: collapse; font-size: 7pt; margin-top: 3px; }
            .rs-table th, .rs-table td { border: 1px solid #333; padding: 2px 3px; text-align: center; vertical-align: middle; }
            .rs-table th { background: #fff; font-weight: bold; font-size: 7pt; line-height: 1.3; padding: 3px 2px; }
            .rs-table td { height: 90px; }
            .rs-table td.office { font-weight: bold; font-size: 7.5pt; }
            .rs-table td.activity { font-size: 7pt; color: #222; line-height: 1.4; }

            .vf-info-table { width: 100%; border-collapse: collapse; font-size: 7.5pt; margin-bottom: 6px; }
            .vf-info-table td { border: 1px solid #555; padding: 3px 4px; vertical-align: top; }
            .vf-info-table .cell-label { font-weight: bold; white-space: nowrap; }
            .vf-info-table .cell-val { font-weight: bold; }

            .vf-section-title { font-size: 8pt; font-weight: bold; margin: 7px 0 4px 0; text-decoration: underline; }
            .vf-checklist { list-style: none; padding: 0 0 0 4px; margin-bottom: 6px; }
            .vf-checklist li { display: flex; align-items: flex-start; gap: 5px; font-size: 7.5pt; margin-bottom: 4px; line-height: 1.4; }
            .cb { display: inline-block; width: 9px; height: 9px; border: 1px solid #333; flex-shrink: 0; margin-top: 1px; }
            .vf-req-label { font-size: 8pt; font-weight: bold; margin-bottom: 4px; margin-top: 2px; }
            .vf-validated { margin-top: 24px; font-size: 8pt; }
            .vf-focal { margin-top: 32px; font-size: 8pt; text-align: center; }

            @media print {
              body { padding: 6px 10px; }
              @page { size: letter landscape; margin: 7mm; }
            }
          </style>
        </head>
        <body>
          <div class="page-wrap">
            <div class="form-col">
              <div style="display:flex;flex-direction:column;align-items:flex-end;font-size:7pt;margin-bottom:2px;">
                <span>Form No.: &nbsp;<strong>GSO-PRP-F01</strong></span>
                <span>Revision No.: &nbsp;<strong>03</strong></span>
              </div>
              <div class="form-title">PROVINCIAL GENERAL SERVICES OFFICE ROUTING SLIP</div>
              <table style="width:100%;border-collapse:collapse;font-size:7.5pt;margin-bottom:3px;">
                <tr>
                  <td style="padding:0 0 1px 0;vertical-align:bottom;">
                    <div style="display:flex;align-items:flex-end;gap:3px;">
                      <div style="display:flex;flex-direction:column;line-height:1.15;font-weight:bold;margin-right:1px;">
                        <span>Requesting</span>
                        <span>Office:</span>
                      </div>
                      <span style="font-weight:bold;border-bottom:1px solid #000;min-width:65px;margin-right:6px;padding-bottom:1px;">${office}</span>
                      <span style="font-weight:bold;white-space:nowrap;margin-right:2px;">Amount :</span>
                      <span style="border-bottom:1px solid #000;min-width:60px;padding-bottom:1px;">${amount}</span>
                    </div>
                  </td>
                  <td style="padding:0 0 1px 0;vertical-align:bottom;text-align:right;white-space:nowrap;">
                    <span style="font-weight:bold;">Routing Slip No.:</span>
                    <span style="border-bottom:1px solid #000;min-width:110px;display:inline-block;margin-left:3px;">&nbsp;</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:1px 0 0 0;vertical-align:top;">
                    <div style="display:flex;align-items:flex-start;gap:3px;">
                      <span style="font-weight:bold;white-space:nowrap;">Particulars:</span>
                      <span style="line-height:1.4;">${particulars}</span>
                    </div>
                  </td>
                  <td style="padding:1px 0 0 0;vertical-align:bottom;text-align:right;white-space:nowrap;">
                    <span style="font-weight:bold;">Focal Person</span>
                    <span style="border-bottom:1px solid #000;min-width:110px;display:inline-block;margin-left:3px;">&nbsp;</span>
                  </td>
                </tr>
              </table>
              <table class="rs-table">
                <thead>
                  <tr>
                    <th style="width:16%;">Office<br/>Concerned</th>
                    <th style="width:26%;">Activity</th>
                    <th style="width:14%;">Name</th>
                    <th style="width:14%;">Signature</th>
                    <th style="width:10%;">Time</th>
                    <th style="width:10%;">Date</th>
                    <th style="width:10%;">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td class="office">PGO/End-user</td><td class="activity">Forward PR with approved OBR</td><td></td><td></td><td></td><td></td><td></td></tr>
                  <tr><td class="office">PGSO</td><td class="activity">Receive PR/OBR</td><td></td><td></td><td></td><td></td><td></td></tr>
                  <tr><td class="office">PGSO</td><td class="activity">Certify as PGB Property<br/><em style="font-size:6.5pt;">(for Equipment/Motor Vehicle)</em></td><td></td><td></td><td></td><td></td><td></td></tr>
                  <tr><td class="office">PGSO</td><td class="activity">Validate PR/OBR</td><td></td><td></td><td></td><td></td><td></td></tr>
                  <tr><td class="office">PGSO</td><td class="activity">Assign PR number &amp;<br/>Update to Monitoring Dashboard</td><td></td><td></td><td></td><td></td><td></td></tr>
                  <tr><td class="office">BAC/End-user</td><td class="activity">Receive Approved OBR-PR</td><td></td><td></td><td></td><td></td><td></td></tr>
                </tbody>
              </table>
            </div>
            <div class="divider"></div>
            <div class="form-col">
              <div style="display:flex;flex-direction:column;align-items:flex-end;font-size:7pt;margin-bottom:2px;">
                <span>Form No.: &nbsp;<strong>${formNo}</strong></span>
                <span>Revision No.: &nbsp;<strong>${revisionNo}</strong></span>
              </div>
              <div className="form-title">PROVINCIAL GENERAL SERVICES OFFICE<br/>VALIDATION FORM</div>
              ${slipUpper.includes("REPAIR") || slipUpper.includes("MOTOR") || slipUpper.includes("MAINTENANCE")
        ? `<div class="form-subtitle" style="text-align:center;font-weight:bold;font-size:8pt;text-decoration:underline;margin-bottom:6px;">REPAIR &amp; MAINTENANCE OF<br/>MOTOR VEHICLES AND EQUIPMENT</div>`
        : `<div class="form-subtitle">${categoryTitle}</div>`
      }
              <table class="vf-info-table">
                <tr>
                  <td class="cell-label" style="width:20%;">Office :</td>
                  <td class="cell-val" style="width:32%;">${office}</td>
                  <td class="cell-label" style="width:12%;">Date:</td>
                  <td style="width:36%;"></td>
                </tr>
                <tr>
                  <td class="cell-label" style="vertical-align:top;">Particulars :</td>
                  <td colspan="3" style="min-height:28px;">${particulars}</td>
                </tr>
                <tr>
                  <td class="cell-label">Amount:</td>
                  <td class="cell-val">${amount}</td>
                  <td class="cell-label">${lastRowLabel}</td>
                  <td></td>
                </tr>
              </table>
              <div class="vf-section-title" style="margin-top:22px;margin-bottom:16px;">Completeness and Correctness of the ff:</div>
              <ul class="vf-checklist" style="margin-bottom:22px;padding-left:20px;">
                <li><span class="cb"></span><span><sup>1.</sup>Signature of Requesting Office</span></li>
                <li><span class="cb"></span><span><sup>2.</sup>Date of OBR and PR</span></li>
              </ul>
              <div class="vf-req-label" style="margin-top:22px;margin-bottom:16px;">Requirements:</div>
              <ul class="vf-checklist" style="margin-bottom:22px;padding-left:20px;">
                ${requirementsHTML}
              </ul>
              <div class="vf-validated">Validated by:</div>
              <div class="vf-focal">(Focal Person for ${focalPerson})</div>
            </div>
          </div>
          <script>window.onload = () => { window.print(); }</script>
        </body>
      </html>
    `)
    printWin.document.close()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => { if (e.currentTarget === e.target) onClose() }}
    >
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <div className="text-base font-semibold text-slate-900">Routing Slips</div>
            <div className="text-xs text-slate-500">{rsDoc.trackingNo}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 focus:outline-none"
            title="Close"
          >
            ✕
          </button>
        </div>
        <div className="px-5 py-5">
          <table className="w-full border-collapse overflow-hidden rounded-lg border border-slate-200 text-sm">
            <thead>
              <tr className="bg-slate-50">
                <th className="border-b border-slate-200 px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Routing Slip</th>
                <th className="border-b border-slate-200 px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Action</th>
              </tr>
            </thead>
            <tbody>
              {String(rsDoc.gsoRoutingSlip || "").trim() ? (
                <tr>
                  <td className="border-b border-slate-100 px-4 py-3 text-sm font-medium text-slate-900">
                    {rsDoc.gsoRoutingSlip}
                  </td>
                  <td className="border-b border-slate-100 px-4 py-3">
                    <button
                      type="button"
                      onClick={handleGenerateRoutingSlip}
                      className="inline-flex items-center gap-1.5 rounded-md bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-sky-700 focus:outline-none"
                    >
                      <Printer className="size-3.5" />
                      Generate
                    </button>
                  </td>
                </tr>
              ) : (
                <tr>
                  <td colSpan={2} className="px-4 py-6 text-center text-sm italic text-slate-400">
                    No routing slip category assigned yet.
                    <br />
                    <span className="text-xs">GSO will assign the category.</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {!String(rsDoc.gsoRoutingSlip || "").trim() && (
            <div className="mt-4 rounded-md bg-slate-50 p-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-600 mb-2">Available Categories:</div>
              <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-500 list-inside list-disc">
                <li>IT and Equipment</li>
                <li>Meals and Events</li>
                <li>Goods and Services</li>
                <li>Repair and Maintenance</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
