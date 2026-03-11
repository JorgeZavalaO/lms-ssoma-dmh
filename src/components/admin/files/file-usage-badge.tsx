import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { FileUsageState } from "@/lib/file-inventory"

const usageStateConfig: Record<FileUsageState, { label: string; className: string }> = {
  IN_USE: {
    label: "Uso directo",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  HEURISTIC_ONLY: {
    label: "Heurístico",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  UNUSED: {
    label: "Sin uso detectado",
    className: "bg-slate-50 text-slate-700 border-slate-200",
  },
}

export function FileUsageBadge({ usageState }: { usageState: FileUsageState }) {
  const config = usageStateConfig[usageState]

  return (
    <Badge variant="outline" className={cn("font-medium", config.className)}>
      {config.label}
    </Badge>
  )
}
