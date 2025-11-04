"use client"

import * as React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/data-table"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { ChangeRoleDialog } from "./widgets/change-role-dialog"
import { CreateCollaboratorDialog, EditCollaboratorDialog, DeleteCollaboratorDialog, ImportCollaboratorsDialog } from "@/components/admin/collaborator-modals"
import { cn } from "@/lib/utils"

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

function Pill({ children, color = "default" }: { children: React.ReactNode; color?: "default"|"success"|"warning"|"danger" }) {
  const map = {
    default: "bg-muted text-foreground/80",
    success: "bg-green-500/10 text-green-700 dark:text-green-300",
    warning: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
    danger: "bg-red-500/10 text-red-700 dark:text-red-300",
  } as const
  return <span className={cn("text-xs px-2 py-1 rounded-full", map[color])}>{children}</span>
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
      cell: ({ getValue }) => <span className="font-medium">{String(getValue())}</span> },
    { accessorKey: "fullName", header: "Nombre" },
    { accessorKey: "email", header: "Email", cell: ({ getValue }) => (
      <a href={`mailto:${getValue()}`} className="underline underline-offset-4 decoration-dotted hover:text-primary">
        {String(getValue())}
      </a>
    ) },
    { header: "Área", cell: ({ row }) =>
        <span className="hidden sm:inline">{row.original.area?.code ?? "-"}</span>
    },
    { header: "Puesto", cell: ({ row }) =>
        <span className="hidden md:inline">{row.original.position?.name ?? "-"}</span>
    },
    { header: "Sede", cell: ({ row }) =>
        <span className="hidden lg:inline">{row.original.site?.code ?? "-"}</span>
    },
    { header: "Estado", cell: ({ row }) =>
        <Pill color={row.original.status === "ACTIVE" ? "success" : "warning"}>
          {row.original.status === "ACTIVE" ? "Activo" : "Inactivo"}
        </Pill>
    },
  { header: "Rol", cell: ({ row }) => {
    const r = row.original.user?.role ?? "—"
    const color: "default" | "success" | "warning" | "danger" =
      r === "SUPERADMIN" ? "danger" : r === "ADMIN" ? "warning" : "default"
    return <Pill color={color}>{r}</Pill>
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
      <a href="/api/collaborators/template?format=xlsx" download>
        <Button variant="outline"><Download className="size-4" /> Template XLSX</Button>
      </a>
      <a href="/api/collaborators/template?format=csv" download>
        <Button variant="outline"><Download className="size-4" /> Template CSV</Button>
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
