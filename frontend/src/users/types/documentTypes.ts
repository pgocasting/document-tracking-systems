// ─── Shared document types used across all tab components ─────────────────────

export type TabType = "pre-validation" | "ongoing" | "completed" | "discontinued"

export type DocumentParticular = {
  label: string
  color: string
}

export type DocumentLog = {
  label: string
  color: string
  byOffice?: string
  byUser?: string
  createdAt?: string
}

export type SubDocument = {
  trackingNo: string
  purpose: string
  amount: string
  supplier?: string
  status: string
  logs: DocumentLog[]
}

export type DocumentRow = {
  id: string
  trackingNo: string
  timestamp: string
  createdBy: string
  office?: string
  fund?: string
  section?: string
  fpp?: string
  department?: string
  contactNumber?: string
  responsibilityCenter?: string
  accountCode?: string
  email?: string
  requestedByName?: string
  requestedByDesignation?: string
  driveLink?: string
  prItems?: Array<{
    itemNo: string
    unit: string
    description: string
    quantity: string
    unitCost: string
    totalCost: string
  }>
  purpose: string
  notes?: string
  particulars: DocumentParticular[]
  amount: string
  supplierAmount?: string
  supplier?: string
  logs: DocumentLog[]
  action: string
  status: string
  prNo?: string
  obrNo?: string
  gsoRoutingSlip?: string
  subDocuments?: SubDocument[]
}

export type PreviewType = "PR" | "OBR"
