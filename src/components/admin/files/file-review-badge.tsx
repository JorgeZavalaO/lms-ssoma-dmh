import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { FileReviewPriority } from "@/lib/file-inventory"

const reviewPriorityConfig: Record<FileReviewPriority, { label: string; className: string }> = {
  HIGH: {
    label: "Prioridad alta",
    className: "bg-red-50 text-red-700 border-red-200",
  },
  MEDIUM: {
    label: "Prioridad media",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  LOW: {
    label: "Monitoreo",
    className: "bg-slate-50 text-slate-700 border-slate-200",
  },
}

export function FileReviewBadge({ priority }: { priority: FileReviewPriority }) {
  const config = reviewPriorityConfig[priority]

  return (
    <Badge variant="outline" className={cn("font-medium", config.className)}>
      {config.label}
    </Badge>
  )
}
