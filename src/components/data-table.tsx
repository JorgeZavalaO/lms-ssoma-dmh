"use client"

import * as React from "react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ChevronLeft, ChevronRight, Loader2, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type DataTableProps<TData, TValue> = {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  page: number
  pageSize: number
  total: number
  onPageChange?: (page: number) => void
  onSearch?: (q: string) => void
  defaultSearch?: string
  rightExtra?: React.ReactNode
  isLoading?: boolean
  emptyText?: string
  className?: string
}

export function DataTable<TData, TValue>({
  columns,
  data,
  page,
  pageSize,
  total,
  onPageChange,
  onSearch,
  defaultSearch = "",
  rightExtra,
  isLoading = false,
  emptyText = "Sin resultados.",
  className,
}: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    pageCount: Math.ceil(total / pageSize),
  })

  const [q, setQ] = React.useState(defaultSearch)

  // Debounce search
  React.useEffect(() => {
    if (!onSearch) return
    const id = setTimeout(() => onSearch(q), 350)
    return () => clearTimeout(id)
  }, [q, onSearch])

  return (
    <div className={cn("space-y-4", className)}>
      {/* Toolbar */}
      <div className="flex items-center gap-2">
        {onSearch && (
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              aria-label="Buscar"
              placeholder="Buscar..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-64 pl-8"
            />
          </div>
        )}
        <div className="ml-auto flex items-center gap-2">{rightExtra}</div>
      </div>

      {/* Table */}
      <div className="rounded-lg border overflow-hidden">
        <div className="relative">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 sticky top-0 z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className="text-left px-3 py-2 font-medium text-muted-foreground">
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                <tr>
                  <td colSpan={columns.length} className="p-6 text-center text-muted-foreground">
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="size-4 animate-spin" /> Cargando…
                    </span>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="p-10 text-center text-muted-foreground">
                    {emptyText}
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row, i) => (
                  <tr
                    key={row.id}
                    className={cn(
                      "hover:bg-accent/40 transition-colors",
                      i % 2 ? "bg-muted/20" : "bg-transparent"
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-3 py-2 align-middle">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          Página {page} de {Math.max(1, Math.ceil(total / pageSize))} — {total} registros
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange?.(Math.max(1, page - 1))}
            disabled={page <= 1 || isLoading}
            aria-label="Anterior"
          >
            <ChevronLeft className="size-4" /> Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange?.(page + 1)}
            disabled={page >= Math.ceil(total / pageSize) || isLoading}
            aria-label="Siguiente"
          >
            Siguiente <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
