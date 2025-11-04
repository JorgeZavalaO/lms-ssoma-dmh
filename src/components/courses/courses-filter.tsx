"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Search, X } from "lucide-react"

interface CoursesFilterProps {
  searchTerm: string
  onSearchChange: (term: string) => void
  modalityFilter: string | null
  onModalityChange: (modality: string | null) => void
  modalityCounts: {
    ASYNCHRONOUS: number
    SYNCHRONOUS: number
    BLENDED: number
  }
  filteredCount: number
  totalCount: number
  hasActiveFilters: boolean
  onClearFilters: () => void
}

export function CoursesFilter({
  searchTerm,
  onSearchChange,
  modalityFilter,
  onModalityChange,
  modalityCounts,
  filteredCount,
  totalCount,
  hasActiveFilters,
  onClearFilters,
}: CoursesFilterProps) {
  return (
    <div className="space-y-4 rounded-lg border bg-card p-6">
      <div className="space-y-4">
        {/* Búsqueda */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Búsqueda
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar por nombre, código u objetivo..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchTerm && (
              <button
                onClick={() => onSearchChange("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Filtro de Modalidad */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
          <div className="w-full sm:flex-1 space-y-2">
            <label className="text-sm font-medium text-foreground">
              Modalidad
            </label>
            <Select value={modalityFilter || "all"} onValueChange={(value) => onModalityChange(value === "all" ? null : value)}>
              <SelectTrigger>
                <SelectValue placeholder="Todas las modalidades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  Todas las modalidades
                </SelectItem>
                <SelectItem value="ASYNCHRONOUS">
                  Asíncrono ({modalityCounts.ASYNCHRONOUS})
                </SelectItem>
                <SelectItem value="SYNCHRONOUS">
                  Síncrono ({modalityCounts.SYNCHRONOUS})
                </SelectItem>
                <SelectItem value="BLENDED">
                  Mixto ({modalityCounts.BLENDED})
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {hasActiveFilters && (
            <Button
              variant="outline"
              size="default"
              onClick={onClearFilters}
              className="w-full sm:w-auto"
            >
              <X className="h-4 w-4 mr-2" />
              Limpiar filtros
            </Button>
          )}
        </div>

        {/* Contador de resultados */}
        {hasActiveFilters && (
          <div className="text-sm text-muted-foreground">
            Mostrando <span className="font-medium text-foreground">{filteredCount}</span> de <span className="font-medium text-foreground">{totalCount}</span> cursos
          </div>
        )}
      </div>
    </div>
  )
}
