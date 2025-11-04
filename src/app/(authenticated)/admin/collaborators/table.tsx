"use client"

import * as React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/common/data-table"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { ChangeRoleDialog } from "./widgets/change-role-dialog"
import { CreateCollaboratorDialog, EditCollaboratorDialog, DeleteCollaboratorDialog, ImportCollaboratorsDialog } from "@/components/admin/collaborators/modals"
import { CollaboratorPill, ExportCollaboratorsButton } from "@/components/admin/collaborators"

type Role = "SUPERADMIN" | "ADMIN" | "COLLABORATOR"

type Row = {
  id: string
  dni: string
  fullName: string
  email: string
  status: "ACTIVE" | "INACTIVE"
  entryDate: string
  site?: { code: string, name: string } | null
  area?: { code: string, name: string } | null
  position?: { name: string } | null
  user?: { id: string, role: Role } | null
}

export default function ClientCollaborators({ initial }: { initial: { items: Row[], total: number, page: number, pageSize: number } }) {
  const [data, setData] = React.useState<Row[]>(initial.items)
  const [total, setTotal] = React.useState(initial.total)
  const [page, setPage] = React.useState(initial.page)
  const [pageSize] = React.useState(initial.pageSize)
  const [q, setQ] = React.useState("")
  const [loading, setLoading] = React.useState(false)

  const load = React.useCallback(async (p = page, query = q) => {
    setLoading(true)
    const res = await fetch(`/api/collaborators?page=${p}&pageSize=${pageSize}&q=${encodeURIComponent(query)}&includeUser=1`, { cache: "no-store" })
    setLoading(false)
    if (!res.ok) return
    const json = await res.json()
    setData(json.items)
    setTotal(json.total)
    setPage(json.page)
  }, [pageSize])

  const handleSearch = React.useCallback((query: string) => {
    setQ(query)
    load(1, query)
  }, [load])

  const columns: ColumnDef<Row>[] = [
    { accessorKey: "dni", header: "DNI",
      cell: ({ getValue }) => <span className="font-medium text-slate-900">{String(getValue())}</span> },
    { accessorKey: "fullName", header: "Nombre", cell: ({ getValue }) => 
      <span className="text-slate-900">{String(getValue())}</span> },
    { accessorKey: "email", header: "Email", cell: ({ getValue }) => (
      <a href={`mailto:${getValue()}`} className="text-emerald-600 hover:text-emerald-700 underline underline-offset-4 decoration-dotted">
        {String(getValue())}
      </a>
    ) },
    { header: "Área", cell: ({ row }) =>
        <span className="hidden sm:inline text-slate-600">{row.original.area?.code ?? "—"}</span>
    },
    { header: "Puesto", cell: ({ row }) =>
        <span className="hidden md:inline text-slate-600">{row.original.position?.name ?? "—"}</span>
    },
    { header: "Sede", cell: ({ row }) =>
        <span className="hidden lg:inline text-slate-600">{row.original.site?.code ?? "—"}</span>
    },
    { header: "Estado", cell: ({ row }) =>
        <CollaboratorPill color={row.original.status === "ACTIVE" ? "success" : "warning"}>
          {row.original.status === "ACTIVE" ? "Activo" : "Inactivo"}
        </CollaboratorPill>
    },
    { header: "Rol", cell: ({ row }) => {
      const r = row.original.user?.role ?? "—"
      const color: "default" | "success" | "warning" | "danger" =
        r === "SUPERADMIN" ? "danger" : r === "ADMIN" ? "warning" : "default"
      return <CollaboratorPill color={color}>{r}</CollaboratorPill>
    }},
    {
      header: "Acciones",
      cell: ({ row }) => (
        <div className="flex gap-2 justify-end">
          <EditCollaboratorDialog collaborator={row.original} onEdited={() => load()} />
          <DeleteCollaboratorDialog collaborator={{ id: row.original.id, fullName: row.original.fullName }} onDeleted={() => load()} />
          <ChangeRoleDialog collaborator={row.original} onChanged={() => load()} />
        </div>
      ),
    },
  ]

  const rightExtra = (
    <div className="flex items-center gap-2">
      <CreateCollaboratorDialog onCreated={() => load()} />
      <ImportCollaboratorsDialog onImported={() => load()} />
      <ExportCollaboratorsButton />
      <a href="/api/collaborators/template?format=xlsx" download>
        <Button variant="outline" className="gap-2"><Download className="h-4 w-4" />Template XLSX</Button>
      </a>
      <a href="/api/collaborators/template?format=csv" download>
        <Button variant="outline" className="gap-2"><Download className="h-4 w-4" />Template CSV</Button>
      </a>
    </div>
  )

  return (
    <DataTable
      columns={columns}
      data={data}
      page={page}
      pageSize={pageSize}
      total={total}
      onPageChange={(p) => load(p)}
      onSearch={handleSearch}
      rightExtra={rightExtra}
      isLoading={loading}
      emptyText="No encontramos colaboradores con ese criterio."
    />
  )
}
