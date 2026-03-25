export const progressStatusConfig = {
  NOT_STARTED: { label: "No Iniciado", color: "bg-slate-500" },
  IN_PROGRESS: { label: "En Progreso", color: "bg-blue-500" },
  COMPLETED: { label: "Completado", color: "bg-emerald-500" },
  FAILED: { label: "Fallido", color: "bg-red-500" },
  EXEMPT: { label: "Exento", color: "bg-purple-500" },
  EXPIRED: { label: "Vencido", color: "bg-amber-600" },
} as const

export type ProgressClientStatus = keyof typeof progressStatusConfig

const statusAliases: Record<string, ProgressClientStatus> = {
  NOTSTARTED: "NOT_STARTED",
  PENDING: "NOT_STARTED",
  INPROGRESS: "IN_PROGRESS",
  PROGRESS: "IN_PROGRESS",
  DONE: "COMPLETED",
  PASSED: "COMPLETED",
  FAIL: "FAILED",
  EXEMPTED: "EXEMPT",
  EXPIRED: "EXPIRED",
}

export function normalizeProgressStatus(
  status: string | null | undefined
): ProgressClientStatus {
  if (!status) return "NOT_STARTED"

  const normalized = status.toString().trim().toUpperCase().replace(/\s+/g, "_")
  if (normalized in progressStatusConfig) {
    return normalized as ProgressClientStatus
  }

  return statusAliases[normalized] ?? "NOT_STARTED"
}

export function mapProgressStatusForClient(
  status: string | null | undefined
): ProgressClientStatus {
  const normalized = (status ?? "").toString().trim().toUpperCase()

  if (normalized === "PASSED") return "COMPLETED"
  if (normalized === "EXEMPTED") return "EXEMPT"
  if (normalized === "EXPIRED") return "EXPIRED"

  return normalizeProgressStatus(normalized)
}
