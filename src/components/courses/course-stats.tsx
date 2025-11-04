import { cn } from "@/lib/utils"

interface CourseStatsProps {
  totalCount: number
  draftCount: number
  publishedCount: number
  archivedCount: number
  activeTab: string
}

interface StatCard {
  id: string
  label: string
  count: number
  colorClass: string
}

export function CourseStats({
  totalCount,
  draftCount,
  publishedCount,
  archivedCount,
  activeTab,
}: CourseStatsProps) {
  const stats: StatCard[] = [
    {
      id: "all",
      label: "Todos",
      count: totalCount,
      colorClass: "border-slate-200 dark:border-slate-700",
    },
    {
      id: "draft",
      label: "Borradores",
      count: draftCount,
      colorClass: "border-amber-200 dark:border-amber-800",
    },
    {
      id: "published",
      label: "Publicados",
      count: publishedCount,
      colorClass: "border-emerald-200 dark:border-emerald-800",
    },
    {
      id: "archived",
      label: "Archivados",
      count: archivedCount,
      colorClass: "border-slate-300 dark:border-slate-600",
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div
          key={stat.id}
          className={cn(
            "relative overflow-hidden rounded-lg border bg-card p-6 transition-all hover:shadow-sm",
            stat.colorClass,
            activeTab === stat.id && "ring-2 ring-primary ring-offset-2 ring-offset-background"
          )}
        >
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {stat.label}
            </p>
            <p className="text-3xl font-semibold tracking-tight text-foreground">
              {stat.count}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
