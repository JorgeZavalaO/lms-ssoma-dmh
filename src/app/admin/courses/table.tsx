"use client"

import * as React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CreateCourseDialog, EditCourseDialog, DeleteCourseDialog, ViewVersionsDialog } from "@/components/admin/course-modals"
import { EnrollToCourseDialog } from "@/components/admin/enrollment-modals"
import Link from "next/link"
import { BookOpen } from "lucide-react"

interface Course {
  id: string
  code: string
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
  DRAFT: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  PUBLISHED: "bg-green-500/10 text-green-500 border-green-500/20",
  ARCHIVED: "bg-gray-500/10 text-gray-500 border-gray-500/20",
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

export function CoursesTable({ data, onRefresh }: CoursesTableProps) {
  const refresh = React.useCallback(() => onRefresh(), [onRefresh])

  const columns = React.useMemo<ColumnDef<Course, unknown>[]>(() => [
    {
      accessorKey: "code",
      header: "Código",
    },
    {
      accessorKey: "name",
      header: "Nombre",
      cell: ({ row }) => (
        <div className="max-w-[300px]">
          <div className="font-medium">{row.original.name}</div>
          {row.original.objective && (
            <div className="text-sm text-muted-foreground truncate">
              {row.original.objective}
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: "modality",
      header: "Modalidad",
      cell: ({ row }) => modalityLabels[row.original.modality] || row.original.modality,
    },
    {
      accessorKey: "duration",
      header: "Duración",
      cell: ({ row }) => row.original.duration ? `${row.original.duration}h` : "-",
    },
    {
      accessorKey: "validity",
      header: "Vigencia",
      cell: ({ row }) => row.original.validity ? `${row.original.validity} meses` : "-",
    },
    {
      accessorKey: "currentVersion",
      header: "Versión",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span>v{row.original.currentVersion}</span>
          <ViewVersionsDialog courseId={row.original.id} />
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Estado",
      cell: ({ row }) => (
        <Badge variant="outline" className={statusColors[row.original.status]}>
          {statusLabels[row.original.status] || row.original.status}
        </Badge>
      ),
    },
    {
      id: "assignments",
      header: "Asignaciones",
      cell: ({ row }) => {
        const total = 
          row.original._count.areaLinks +
          row.original._count.posLinks +
          row.original._count.siteLinks +
          row.original._count.collLinks
        return (
          <div className="text-sm">
            <div>Total: {total}</div>
            <div className="text-xs text-muted-foreground">
              Rutas: {row.original._count.pathCourses}
            </div>
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
