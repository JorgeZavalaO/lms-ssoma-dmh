export interface Certificate {
  id: string
  certificateNumber: string
  collaboratorName: string
  collaboratorDni: string
  courseName: string
  issuedAt: string
  expiresAt: string | null
  isValid: boolean
  verificationCode: string | null
  hasPdf: boolean
}

export interface CertificateStats {
  total: number
  valid: number
  invalid: number
  expiring: number
}

export type CertificateValidityFilter = "all" | "valid" | "invalid"
