"use client"

import { cn } from "@/lib/utils"

type PillColor = "default" | "success" | "warning" | "danger"

interface CollaboratorPillProps {
  children: React.ReactNode
  color?: PillColor
}

const colorMap: Record<PillColor, string> = {
  default: "bg-slate-50 text-slate-700 border border-slate-200",
  success: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  warning: "bg-amber-50 text-amber-700 border border-amber-200",
  danger: "bg-red-50 text-red-700 border border-red-200",
}

export function CollaboratorPill({ children, color = "default" }: CollaboratorPillProps) {
  return (
    <span className={cn("text-xs px-2.5 py-1.5 rounded-full font-medium", colorMap[color])}>
      {children}
    </span>
  )
}
