export type DvTemplateModel = {
  /** Top-right fields */
  fund?: string
  dvNo?: string
  date?: string

  /** Payee section */
  payee?: string
  address?: string
  idNoTin?: string
  obrNo?: string
  responsibilityCenter?: string

  /** Particulars / amount */
  particulars?: string
  amount?: string
  amountDue?: string

  /** Section A */
  certifiedAName?: string
  certifiedAPosition?: string

  /** Section B */
  certifiedBName?: string
  certifiedBPosition?: string

  /** Section C */
  certifiedCName?: string
  certifiedCPosition?: string

  /** Section D */
  approvedForPaymentName?: string
  approvedForPaymentPosition?: string

  /** Section F */
  preparedByName?: string
  certifiedCorrectName?: string
  certifiedCorrectPosition?: string

  /** General status & tracking */
  trackingNo?: string
  status?: string
  logs?: Array<{ label?: string; byOffice?: string; [key: string]: any }>
  hasPr?: boolean
  hasObr?: boolean
}

type DvTemplatePreviewProps = {
  model: DvTemplateModel
  className?: string
}

export default function DvTemplatePreview({ model, className }: DvTemplatePreviewProps) {
  const payeeText = model.payee || ""
  const addressText = model.address || ""
  const particularsText = model.particulars || ""
  const amountText = model.amount || ""
  const amountDueText = model.amountDue || model.amount || ""

  const certAName = model.certifiedAName || "JOSE ENRIQUE S. GARCIA III"
  const certAPos = model.certifiedAPosition || "Provincial Governor"

  const certBName = model.certifiedBName || "EDUARDO D. BANZON"
  const certBPos = model.certifiedBPosition || "Provincial Budget Officer"

  const certCName = model.certifiedCName || "ALICIA R. MAGPANTAY"
  const certCPos = model.certifiedCPosition || "Provincial Treasurer"

  const appName = model.approvedForPaymentName || "MA. CRISTINA M. GARCIA"
  const appPos = model.approvedForPaymentPosition || "Acting - Provincial Governor"

  const certCorrectName = model.certifiedCorrectName || "MYRNA B. ROMAN"
  const certCorrectPos = model.certifiedCorrectPosition || "Acting Provincial Accountant"

  return (
    <div className={className}>
      <div
        className="print-page bg-white relative w-[816px] h-[1056px] overflow-hidden mx-auto p-3.5 print-no-mt text-black shadow-lg border border-slate-300 print:shadow-none print:border-none select-none box-border"
        style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
      >
        {/* Continuous Printable Box with crisp 2px border matching Short Bond exactly */}
        <div className="w-full h-full border-2 border-black flex flex-col box-border overflow-hidden bg-white text-black">
          {/* 1. Header row (Height: 82px) */}
          <div className="grid grid-cols-[1fr_195px] border-b-2 border-black shrink-0 h-[82px]">
            {/* Left Header Box (Logos + Titles) */}
            <div className="flex items-center justify-between px-4 py-2">
              <img
                src="/images/bataan-seal.png"
                alt="Provincial Seal"
                className="h-14 w-14 object-contain shrink-0"
              />

              <div className="flex flex-col items-center justify-center flex-1 px-3 text-center">
                <div className="text-[17px] font-bold tracking-wider uppercase leading-tight pt-1 pb-1">
                  DISBURSEMENT VOUCHER
                </div>
                <div className="text-[12px] font-bold leading-tight pb-0.5">
                  Provincial Government of Bataan
                </div>
                <div className="text-[11px] italic leading-tight text-slate-800">LGU</div>
              </div>

              <img
                src="/images/1bataan-logo.png"
                alt="1Bataan"
                className="h-12 w-12 object-contain shrink-0"
              />
            </div>

            {/* Right Header Box (Fund, DV No, Date) */}
            <div className="border-l-2 border-black flex flex-col justify-between text-[11px]">
              <div className="border-b border-black px-3 flex items-center h-[38px] pt-1">
                <span className="font-normal">Fund:&nbsp;</span>
                <span className="font-bold">{model.fund || "General Fund"}</span>
              </div>
              <div className="px-3 py-1 flex-1 flex flex-col justify-center space-y-1 pt-1.5 pb-1">
                <div className="flex items-center justify-between">
                  <span className="font-normal">DV No.:&nbsp;</span>
                  <span className="font-bold">{model.dvNo || ""}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-normal">Date:&nbsp;</span>
                  <span className="font-bold">{model.date || ""}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Blank separator band */}
          <div className="h-[10px] border-b border-black bg-white shrink-0" />

          {/* 3. Payee / Address & OBR / TIN Section (Height: 74px) */}
          <div className="grid grid-cols-[1fr_195px] border-b-2 border-black shrink-0 h-[74px]">
            {/* Payee & Address */}
            <div className="flex flex-col justify-between">
              <div className="border-b border-black px-3 flex items-center gap-2 h-[37px] pt-1.5">
                <span className="w-16 shrink-0 text-[11px] font-normal text-black">Payee:</span>
                <span className="font-bold text-[12px] uppercase tracking-wide truncate">
                  {payeeText}
                </span>
              </div>
              <div className="px-3 flex items-center gap-2 h-[37px] pt-1.5">
                <span className="w-16 shrink-0 text-[11px] font-normal text-black">Address:</span>
                <span className="font-bold text-[12px] uppercase tracking-wide truncate">
                  {addressText}
                </span>
              </div>
            </div>

            {/* ID No, OBR No, Responsibility Center */}
            <div className="border-l-2 border-black px-3 py-1 flex flex-col justify-center space-y-1 text-[10.5px] leading-tight pt-1.5 pb-1">
              <div>
                <span className="font-normal">ID No./TIN:&nbsp;</span>
                <span className="font-bold">{model.idNoTin || ""}</span>
              </div>
              <div>
                <span className="font-normal">OBR No.:&nbsp;</span>
                <span className="font-bold">{model.obrNo || ""}</span>
              </div>
              <div>
                <span className="font-normal">Responsibility Center:&nbsp;</span>
                <span className="font-bold">{model.responsibilityCenter || ""}</span>
              </div>
            </div>
          </div>

          {/* 4. Particulars & Amount Table (Pure Div Layout to avoid html2canvas table baseline bugs) */}
          <div className="flex flex-col shrink-0">
            {/* Header row */}
            <div className="grid grid-cols-[1fr_195px] border-b-2 border-black font-bold text-[12px] text-center bg-white h-[34px] items-center">
              <div className="border-r-2 border-black h-full flex items-center justify-center pt-1.5 pb-0.5">
                Particulars
              </div>
              <div className="h-full flex items-center justify-center pt-1.5 pb-0.5">
                Amount
              </div>
            </div>

            {/* Row 1 with dynamic item particulars */}
            <div className="grid grid-cols-[1fr_195px] border-b border-black min-h-[30px]">
              <div className="border-r-2 border-black px-3 py-2 text-[11px] font-normal leading-snug flex items-center pt-2">
                {particularsText}
              </div>
              <div className="px-3 py-2 text-right text-[11.5px] font-bold flex items-center justify-end pt-2">
                {amountText}
              </div>
            </div>

            {/* 14 continuous ledger rows connecting down to Amount Due */}
            {Array.from({ length: 14 }).map((_, idx) => (
              <div
                key={`empty-row-${idx}`}
                className="grid grid-cols-[1fr_195px] border-b border-black h-[20px]"
              >
                <div className="border-r-2 border-black px-3 h-full">&nbsp;</div>
                <div className="px-3 h-full">&nbsp;</div>
              </div>
            ))}

            {/* Amount Due / Total Row */}
            <div className="grid grid-cols-[1fr_195px] border-b-2 border-black text-[12px] bg-white font-bold h-[34px] items-center">
              <div className="border-r-2 border-black text-right pr-6 h-full flex items-center justify-end font-bold pt-1.5 pb-0.5">
                Amount Due
              </div>
              <div className="text-right pr-3 h-full flex items-center justify-end font-bold pt-1.5 pb-0.5">
                {amountDueText}
              </div>
            </div>
          </div>

          {/* 5. Certifications Section A, B, C (Height: 168px) */}
          <div className="grid grid-cols-3 border-b-2 border-black shrink-0 h-[168px]">
            {/* Box A */}
            <div className="border-r-2 border-black px-3 pt-3.5 pb-1.5 flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center gap-2 pt-1">
                  <span className="border border-black w-4.5 h-4.5 flex items-center justify-center text-[10px] font-bold leading-none shrink-0 pt-0.5">
                    A
                  </span>
                  <span className="font-bold text-[11.5px] leading-tight pt-0.5">Certified:</span>
                </div>
                <div className="mt-2 pl-2 text-[10px] leading-relaxed text-black">
                  Expenses/Cash Advances necessary, valid, proper, lawful and incurred under my
                  direct supervision.
                </div>
              </div>
              <div className="text-center pt-2 pb-1">
                <div className="border-b border-black w-[88%] mx-auto mb-1" />
                <div className="font-bold text-[10.5px] uppercase tracking-wide">
                  {certAName}
                </div>
                <div className="text-[9.5px] text-slate-700">{certAPos}</div>
              </div>
            </div>

            {/* Box B */}
            <div className="border-r-2 border-black px-3 pt-3.5 pb-1.5 flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center gap-2 pt-1">
                  <span className="border border-black w-4.5 h-4.5 flex items-center justify-center text-[10px] font-bold leading-none shrink-0 pt-0.5">
                    B
                  </span>
                  <span className="font-bold text-[11.5px] leading-tight pt-0.5">Certified:</span>
                </div>
                <div className="mt-2 pl-2 text-[10px] leading-relaxed text-black">
                  Completeness and propriety of supporting documents/previous cash advance
                  liquidated/existence of funds held in trust.
                </div>
              </div>
              <div className="text-center pt-2 pb-1">
                <div className="border-b border-black w-[88%] mx-auto mb-1" />
                <div className="font-bold text-[10.5px] uppercase tracking-wide">
                  {certBName}
                </div>
                <div className="text-[9.5px] text-slate-700">{certBPos}</div>
              </div>
            </div>

            {/* Box C */}
            <div className="px-3 pt-3.5 pb-1.5 flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center gap-2 pt-1">
                  <span className="border border-black w-4.5 h-4.5 flex items-center justify-center text-[10px] font-bold leading-none shrink-0 pt-0.5">
                    C
                  </span>
                  <span className="font-bold text-[11.5px] leading-tight pt-0.5">Certified:</span>
                </div>
                <div className="mt-2 pl-2 text-[10px] leading-relaxed text-black">
                  Funds available for the purpose.
                </div>
              </div>
              <div className="text-center pt-2 pb-1">
                <div className="border-b border-black w-[88%] mx-auto mb-1" />
                <div className="font-bold text-[10.5px] uppercase tracking-wide">
                  {certCName}
                </div>
                <div className="text-[9.5px] text-slate-700">{certCPos}</div>
              </div>
            </div>
          </div>

          {/* 6. Section D, Payment details, Section E (Height: 132px) */}
          <div className="grid grid-cols-3 border-b-2 border-black shrink-0 h-[132px]">
            {/* Box D */}
            <div className="border-r-2 border-black px-3 pt-3.5 pb-1.5 flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center gap-2 pt-1">
                  <span className="border border-black w-4.5 h-4.5 flex items-center justify-center text-[10px] font-bold leading-none shrink-0 pt-0.5">
                    D
                  </span>
                  <span className="font-bold text-[11.5px] leading-tight flex items-center pt-0.5">
                    Approved For Payment:&nbsp;P
                    <span className="inline-block border-b border-black w-14 ml-1" />
                  </span>
                </div>
              </div>
              <div className="text-center pt-2 pb-1">
                <div className="border-b border-black w-[88%] mx-auto mb-1" />
                <div className="font-bold text-[10.5px] uppercase tracking-wide">
                  {appName}
                </div>
                <div className="text-[9.5px] text-slate-700">{appPos}</div>
              </div>
            </div>

            {/* Payment Arrow Center Box */}
            <div className="border-r-2 border-black px-3 py-1.5 flex items-center justify-center gap-2 h-full">
              {/* Solid Black Arrow */}
              <div className="shrink-0 flex items-center">
                <svg
                  className="w-6 h-4.5 fill-black"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M2 9h11V4l9 8-9 8v-5H2V9z" />
                </svg>
              </div>

              <div className="text-[10px] space-y-1 flex-1 max-w-[140px] pt-1">
                <div className="font-bold text-[10px]">Payment:</div>
                <div className="pl-1.5 flex items-center">
                  <span className="shrink-0 font-normal">Check No.</span>
                  <span className="flex-1 border-b border-black ml-1 inline-block h-2.5 min-w-[40px]" />
                </div>
                <div className="pl-1.5 flex items-center">
                  <span className="shrink-0 font-normal">Bank Name:</span>
                  <span className="flex-1 border-b border-black ml-1 inline-block h-2.5 min-w-[35px]" />
                </div>
                <div className="pl-1.5 flex items-center">
                  <span className="shrink-0 font-normal">Date:</span>
                  <span className="flex-1 border-b border-black ml-1 inline-block h-2.5 min-w-[50px]" />
                </div>
              </div>
            </div>

            {/* Box E */}
            <div className="flex flex-col justify-between h-full">
              <div className="px-3 pt-3.5">
                <div className="flex items-center gap-2 pt-1">
                  <span className="border border-black w-4.5 h-4.5 flex items-center justify-center text-[10px] font-bold leading-none shrink-0 pt-0.5">
                    E
                  </span>
                  <span className="font-bold text-[11.5px] leading-tight pt-0.5">Received Payment:</span>
                </div>
              </div>

              <div className="border-t border-black px-3 pt-2 pb-1.5">
                <div className="text-center text-[9.5px] text-slate-700 leading-tight">
                  Signature Over Printed Name/Position
                </div>
                <div className="mt-1.5 text-left text-[10px] flex items-center">
                  <span className="shrink-0 font-normal">Date</span>
                  <span className="flex-1 border-b border-black ml-1.5 inline-block h-2.5" />
                </div>
              </div>
            </div>
          </div>

          {/* 7. Section F - Accounting Entries (Height: 142px) */}
          <div className="flex flex-col shrink-0 h-[142px]">
            <div className="border-b-2 border-black px-3 flex items-center gap-2 bg-white h-[30px] pt-1">
              <span className="border border-black w-4.5 h-4.5 flex items-center justify-center text-[10px] font-bold leading-none shrink-0 pt-0.5">
                F
              </span>
              <span className="font-bold text-[11.5px] leading-tight pt-0.5">Accounting Entries</span>
            </div>

            {/* Sub-table Headers, body & footer signatures (Pure Div Layout) */}
            <div className="flex flex-col flex-1 text-[10px]">
              {/* Columns Header */}
              <div className="grid grid-cols-[42%_18%_20%_20%] border-b border-black font-bold text-center bg-white h-[26px] items-center">
                <div className="border-r border-black h-full flex items-center justify-center pt-1 pb-0.5">
                  Particulars
                </div>
                <div className="border-r border-black h-full flex items-center justify-center pt-1 pb-0.5">
                  Account Code
                </div>
                <div className="border-r border-black h-full flex items-center justify-center pt-1 pb-0.5">
                  Debit
                </div>
                <div className="h-full flex items-center justify-center pt-1 pb-0.5">
                  Credit
                </div>
              </div>

              {/* Empty entry row */}
              <div className="grid grid-cols-[42%_18%_20%_20%] border-b border-black h-[28px]">
                <div className="border-r border-black h-full">&nbsp;</div>
                <div className="border-r border-black h-full">&nbsp;</div>
                <div className="border-r border-black h-full">&nbsp;</div>
                <div className="h-full">&nbsp;</div>
              </div>

              {/* Signatures: Prepared by & Certified Correct */}
              <div className="grid grid-cols-[42%_58%] flex-1">
                {/* Prepared by */}
                <div className="border-r border-black px-3 pt-2 pb-1 flex flex-col justify-between h-full">
                  <div className="text-[10px] font-normal pt-0.5">Prepared by:</div>
                  <div className="text-center pb-0.5">
                    <div className="border-b border-black w-4/5 mx-auto mb-1" />
                    <div className="text-[10px] font-normal">Accounting Personnel</div>
                  </div>
                </div>

                {/* Certified Correct */}
                <div className="px-3 pt-2 pb-1 flex flex-col justify-between h-full">
                  <div className="text-[10px] font-normal pt-0.5">Certified Correct:</div>
                  <div className="text-center pb-0.5">
                    <div className="font-bold text-[10.5px] uppercase tracking-wide">
                      {certCorrectName}
                    </div>
                    <div className="border-b border-black w-4/5 mx-auto my-0.5" />
                    <div className="text-[9.5px] text-slate-700">{certCorrectPos}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

