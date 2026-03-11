import { ArchiveX, EyeOff, ShieldCheck } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { FileLifecycleStatus } from "@prisma/client"

const lifecycleConfig: Record<FileLifecycleStatus, { label: string; className: string; icon: typeof ShieldCheck }> = {
  ACTIVE: {
    label: "Activo",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    icon: ShieldCheck,
  },
  DISABLED: {
    label: "Deshabilitado",
    className: "border-amber-200 bg-amber-50 text-amber-700",
    icon: EyeOff,
  },
  DELETED: {
    label: "Eliminado",
    className: "border-rose-200 bg-rose-50 text-rose-700",
    icon: ArchiveX,
  },
}

export function FileLifecycleBadge({ status }: { status: FileLifecycleStatus }) {
  const config = lifecycleConfig[status]
  const Icon = config.icon

  return (
    <Badge variant="outline" className={`gap-1.5 ${config.className}`}>
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </Badge>
  )
}