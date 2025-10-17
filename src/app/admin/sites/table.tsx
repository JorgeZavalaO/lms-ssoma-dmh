"use client"

import * as React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/data-table"
import { CreateSiteDialog, EditSiteDialog, DeleteSiteDialog } from "@/components/admin/site-modals"

type Row = {
  id: string
  name: string
  code: string
  _count?: { collaborators: number }
}

export default function ClientSites({ initial }: { initial: Row[] }) {
  const data = initial

  const columns: ColumnDef<Row>[] = [
    { accessorKey: "code", header: "Código",
      cell: ({ getValue }) => <span className="font-medium">{String(getValue())}</span> },
    { accessorKey: "name", header: "Nombre" },
    { header: "Colaboradores", cell: ({ row }) => row.original._count?.collaborators ?? 0 },
    { header: "Acciones", cell: ({ row }) => <div className="flex gap-2 justify-end"><EditSiteDialog site={row.original} onEdited={() => window.location.reload()} /><DeleteSiteDialog site={{ id: row.original.id, name: row.original.name }} onDeleted={() => window.location.reload()} /></div> },
  ]

  const rightExtra = (
    <CreateSiteDialog onCreated={() => window.location.reload()} />
  )

  return (
    <DataTable
      columns={columns}
      data={data}
      page={1}
      pageSize={data.length || 1}
      total={data.length}
      rightExtra={rightExtra}
      emptyText="Aún no hay sedes registradas."
    />
  )
}