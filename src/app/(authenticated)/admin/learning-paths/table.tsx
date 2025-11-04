"use client"

import * as React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/common/data-table"
import { Badge } from "@/components/ui/badge"
import { CreateLearningPathDialog, EditLearningPathDialog, DeleteLearningPathDialog, ManageCoursesDialog } from "@/components/admin/learning-paths/modals"

interface LearningPath {
  id: string
  code: string
  name: string
  description?: string | null
  status: string
  createdAt: Date
  courses: any[]
  _count: {
    courses: number
  }
}

interface LearningPathsTableProps {
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

export function LearningPathsTable({ data, onRefresh }: LearningPathsTableProps) {
  const columns: ColumnDef<LearningPath, unknown>[] = [
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
          {row.original.description && (
            <div className="text-sm text-muted-foreground truncate">
              {row.original.description}
            </div>
          )}
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
      id: "courses",
      header: "Cursos",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{row.original._count.courses}</Badge>
          {row.original._count.courses > 0 && (
            <ManageCoursesDialog pathId={row.original.id} courses={row.original.courses} onRefresh={onRefresh} />
          )}
        </div>
      ),
    },
    {
      id: "progress",
      header: "Avance",
      cell: ({ row }) => {
        const totalDuration = row.original.courses.reduce(
          (sum, pc) => sum + (pc.course?.duration || 0),
          0
        )
        return (
          <div className="text-sm">
            <div>Duración total: {totalDuration}h</div>
            <div className="text-xs text-muted-foreground">
              {row.original.courses.filter(pc => pc.isRequired).length} obligatorios
            </div>
          </div>
        )
      },
    },
    {
      id: "actions",
      header: "Acciones",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <ManageCoursesDialog pathId={row.original.id} courses={row.original.courses} onRefresh={onRefresh} />
          <EditLearningPathDialog path={row.original} onEdited={onRefresh} />
          <DeleteLearningPathDialog path={row.original} onDeleted={onRefresh} />
        </div>
      ),
    },
  ]

  return (
    <DataTable<LearningPath, unknown>
      columns={columns}
      data={data as LearningPath[]}
      page={1}
      pageSize={data.length || 10}
      total={data.length}
      rightExtra={<CreateLearningPathDialog onCreated={onRefresh} />}
    />
  )
}
