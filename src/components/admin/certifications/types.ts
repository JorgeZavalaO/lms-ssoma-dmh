export interface Certification {
  id: string
  collaborator: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  course: {
    id: string
    name: string
    code: string
    validityMonths: number | null
  }
  issuedAt: string
  expiresAt: string | null
  revokedAt: string | null
  revokedBy: string | null
  revocationReason: string | null
}

export interface CertificationStats {
  valid: number
  expiringSoon: number
  expired: number
  revoked: number
}

export type CertificationStatus = "valid" | "expiring" | "expired" | "revoked"

export type CertificationStatusFilter = "all" | CertificationStatus

export const certificationStatusConfig: Record<CertificationStatus, { label: string; badge: string }> = {
  valid: { label: "Vigente", badge: "bg-emerald-100 text-emerald-900" },
  expiring: { label: "Por Vencer", badge: "bg-amber-100 text-amber-900" },
  expired: { label: "Vencida", badge: "bg-red-100 text-red-900" },
  revoked: { label: "Revocada", badge: "bg-slate-100 text-slate-900" },
}
