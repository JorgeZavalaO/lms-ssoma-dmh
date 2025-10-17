"use client"

import * as React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/data-table"
import { ChangeHeadDialog } from "./widgets/change-head-dialog"
import { CreateAreaDialog, EditAreaDialog, DeleteAreaDialog } from "@/components/admin/area-modals"

type Row = {
  id: string
  name: string
  code: string
  positions: { id: string }[]
  _count?: { collaborators: number }
}

export default function ClientAreas({ initial }: { initial: Row[] }) {
  const data = initial

  const columns: ColumnDef<Row>[] = [
    { accessorKey: "code", header: "Código",
      cell: ({ getValue }) => <span className="font-medium">{String(getValue())}</span> },
    { accessorKey: "name", header: "Nombre" },
    { header: "Puestos", cell: ({ row }) => row.original.positions.length },
    { header: "Colaboradores", cell: ({ row }) => row.original._count?.collaborators ?? 0 },
    { header: "Acciones", cell: ({ row }) => <div className="flex gap-2 justify-end"><EditAreaDialog area={row.original} onEdited={() => window.location.reload()} /><DeleteAreaDialog area={{ id: row.original.id, name: row.original.name }} onDeleted={() => window.location.reload()} /><ChangeHeadDialog area={row.original} /></div> },
  ]

  const rightExtra = (
    <CreateAreaDialog onCreated={() => window.location.reload()} />
  )

  return (
    <DataTable
      columns={columns}
      data={data}
      page={1}
      pageSize={data.length || 1}
      total={data.length}
      rightExtra={rightExtra}
      emptyText="Aún no hay áreas registradas."
    />
  )
}
