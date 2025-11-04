"use client"

import * as React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/common/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CreateCourseDialog, EditCourseDialog, DeleteCourseDialog, ViewVersionsDialog } from "@/components/admin/courses/modals"
import { EnrollToCourseDialog } from "@/components/admin/enrollments/modals"
import { CourseLessonsPreviewDialog } from "@/components/admin/courses/lessons-preview"
import Link from "next/link"
import { BookOpen } from "lucide-react"

interface Course {
  id: string
  code: string | null
  name: string
  description?: string | null
  objective?: string | null
  duration?: number | null
  modality: string
  validity?: number | null
  requirements?: string | null
  status: string
  currentVersion: number
  createdAt: Date
  _count: {
    versions: number
    pathCourses: number
    areaLinks: number
    posLinks: number
    siteLinks: number
    collLinks: number
  }
}

interface CoursesTableProps {
  data: unknown[]
  onRefresh: () => void
}

const statusColors: Record<string, string> = {
  DRAFT: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-900",
  PUBLISHED: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-900",
  ARCHIVED: "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900/50 dark:text-slate-400 dark:border-slate-800",
}

const statusLabels: Record<string, string> = {
  DRAFT: "Borrador",
  PUBLISHED: "Publicado",
  ARCHIVED: "Archivado",
}

const modalityLabels: Record<string, string> = {
  ASYNCHRONOUS: "Asíncrono",
  SYNCHRONOUS: "Síncrono",
  BLENDED: "Mixto",
}

const modalityColors: Record<string, string> = {
  ASYNCHRONOUS: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-900",
  SYNCHRONOUS: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-900",
  BLENDED: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-900",
}

export function CoursesTable({ data, onRefresh }: CoursesTableProps) {
  const refresh = React.useCallback(() => onRefresh(), [onRefresh])

  const columns = React.useMemo<ColumnDef<Course, unknown>[]>(() => [
    {
      accessorKey: "code",
      header: "Código",
      cell: ({ row }) => (
        <div className="font-mono text-sm">
          {row.original.code ? (
            <span className="font-medium text-foreground">{row.original.code}</span>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "name",
      header: "Nombre del Curso",
      cell: ({ row }) => (
        <div className="max-w-[350px]">
          <div className="font-medium text-foreground line-clamp-1">{row.original.name}</div>
          {row.original.objective && (
            <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
              {row.original.objective}
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: "modality",
      header: "Modalidad",
      cell: ({ row }) => (
        <Badge variant="outline" className={`${modalityColors[row.original.modality] || ""} text-xs font-normal`}>
          {modalityLabels[row.original.modality] || row.original.modality}
        </Badge>
      ),
    },
    {
      accessorKey: "duration",
      header: "Duración",
      cell: ({ row }) => (
        <div className="text-sm">
          {row.original.duration ? (
            <span className="text-foreground font-medium">{row.original.duration}h</span>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "validity",
      header: "Vigencia",
      cell: ({ row }) => (
        <div className="text-sm">
          {row.original.validity ? (
            <span className="text-foreground font-medium">{row.original.validity}m</span>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "currentVersion",
      header: "Versión",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 bg-muted rounded text-sm font-medium text-foreground">
            v{row.original.currentVersion}
          </span>
          <ViewVersionsDialog courseId={row.original.id} />
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Estado",
      cell: ({ row }) => (
        <Badge variant="outline" className={`${statusColors[row.original.status]} text-xs font-normal`}>
          {statusLabels[row.original.status] || row.original.status}
        </Badge>
      ),
    },
    {
      id: "assignments",
      header: "Asignaciones",
      cell: ({ row }) => {
        const areas = row.original._count?.areaLinks ?? 0
        const positions = row.original._count?.posLinks ?? 0
        const sites = row.original._count?.siteLinks ?? 0
        const collaborators = row.original._count?.collLinks ?? 0
        const paths = row.original._count?.pathCourses ?? 0
        const total = areas + positions + sites + collaborators + paths
        
        return (
          <div className="text-sm">
            <div className="font-medium text-foreground">
              {total}
            </div>
            {total > 0 && (
              <div className="text-xs text-muted-foreground mt-0.5">
                {[
                  areas > 0 && `${areas} área${areas > 1 ? 's' : ''}`,
                  positions > 0 && `${positions} puesto${positions > 1 ? 's' : ''}`,
                  sites > 0 && `${sites} sede${sites > 1 ? 's' : ''}`,
                  collaborators > 0 && `${collaborators} colab.`,
                  paths > 0 && `${paths} ruta${paths > 1 ? 's' : ''}`
                ].filter(Boolean).join(', ')}
              </div>
            )}
          </div>
        )
      },
    },
    {
      id: "actions",
      header: "Acciones",
      cell: ({ row }) => (
        <ActionsCell course={row.original} onRefresh={refresh} />
      ),
    },
  ], [refresh])

  return (
    <DataTable<Course, unknown>
      columns={columns}
      data={data as Course[]}
      page={1}
      pageSize={data.length || 10}
      total={data.length}
      rightExtra={<CreateCourseDialog onCreated={refresh} />}
    />
  )
}

const ActionsCell = React.memo(function ActionsCell({
  course,
  onRefresh,
}: {
  course: Course
  onRefresh: () => void
}) {
  return (
    <div className="flex gap-2">
      <CourseLessonsPreviewDialog courseId={course.id} courseName={course.name} />
      <Link href={`/admin/courses/${course.id}/content`}>
        <Button variant="outline" size="sm">
          <BookOpen className="h-4 w-4 mr-1" />
          Contenido
        </Button>
      </Link>
      <EnrollToCourseDialog
        courseId={course.id}
        courseName={course.name}
        onEnrolled={onRefresh}
      />
      <EditCourseDialog course={course} onEdited={onRefresh} />
      <DeleteCourseDialog course={course} onDeleted={onRefresh} />
    </div>
  )
})
