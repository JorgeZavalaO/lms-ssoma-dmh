import { Separator } from "@/components/ui/separator"

interface CoursesHeaderProps {
  totalCourses: number
  publishedCount: number
}

export function CoursesHeader({ totalCourses, publishedCount }: CoursesHeaderProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Catálogo de Cursos
        </h1>
        <p className="text-sm text-muted-foreground">
          Gestiona cursos, versiones y rutas de aprendizaje
        </p>
      </div>
      
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Total:</span>
          <span className="font-semibold text-foreground">{totalCourses}</span>
        </div>
        <Separator orientation="vertical" className="h-4" />
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Publicados:</span>
          <span className="font-semibold text-emerald-600 dark:text-emerald-400">{publishedCount}</span>
        </div>
      </div>
    </div>
  )
}
