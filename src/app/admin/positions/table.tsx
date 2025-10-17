"use client"

import * as React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/data-table"
import { Input } from "@/components/ui/input"
import { CreatePositionDialog, EditPositionDialog, DeletePositionDialog } from "@/components/admin/position-modals"

type Row = { id: string; name: string; area: { id: string; name: string; code: string } }

export default function ClientPositions({ initial }: { initial: Row[] }) {
  const [data] = React.useState<Row[]>(initial)
  const [filtered, setFiltered] = React.useState<Row[]>(initial)
  const [q, setQ] = React.useState("")
  const pageSize = 50

  const columns: ColumnDef<Row>[] = [
    { accessorKey: "name", header: "Puesto",
      cell: ({ getValue }) => <span className="font-medium">{String(getValue())}</span> },
    { header: "Área", cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.area.code}</span>
      ) },
    { header: "Nombre de área", cell: ({ row }) => (
        <span className="hidden sm:inline">{row.original.area.name}</span>
      ) },
    { header: "Acciones", cell: ({ row }) => <div className="flex gap-2 justify-end"><EditPositionDialog position={row.original} onEdited={() => window.location.reload()} /><DeletePositionDialog position={{ id: row.original.id, name: row.original.name }} onDeleted={() => window.location.reload()} /></div> },
  ]

  React.useEffect(() => {
    if (!q) { setFiltered(data); return }
    const ql = q.toLowerCase()
    setFiltered(data.filter(r =>
      r.name.toLowerCase().includes(ql) ||
      r.area.name.toLowerCase().includes(ql) ||
      r.area.code.toLowerCase().includes(ql)
    ))
  }, [q, data])

  const rightExtra = (
    <CreatePositionDialog onCreated={() => window.location.reload()} />
  )

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Input placeholder="Buscar puesto o área..." value={q} onChange={(e) => setQ(e.target.value)} className="w-72" />
      </div>
      <DataTable
        columns={columns}
        data={filtered}
        page={1}
        pageSize={pageSize}
        total={filtered.length}
        rightExtra={rightExtra}
        emptyText="No se encontraron puestos con ese criterio."
      />
    </div>
  )
}
