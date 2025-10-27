"use client"

import * as React from "react"
import { CoursesTable } from "./table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search, X } from "lucide-react"

interface ClientCoursesProps {
  initialCourses: {
    id: string
    code: string | null
    name: string
    status: string
    modality?: string
    [key: string]: unknown
  }[]
}

export function ClientCourses({ initialCourses }: ClientCoursesProps) {
  const [courses, setCourses] = React.useState(initialCourses)
  const [activeTab, setActiveTab] = React.useState("all")
  const [searchTerm, setSearchTerm] = React.useState("")
  const [modalityFilter, setModalityFilter] = React.useState<string | null>(null)
  const [filteredCourses, setFilteredCourses] = React.useState(initialCourses)
  
  // Aplicar filtros y búsqueda
  React.useEffect(() => {
    let filtered = courses

    // Filtro por búsqueda (nombre, código, objetivo)
    if (searchTerm) {
      filtered = filtered.filter(course =>
        course.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (course as any).objective?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtro por modalidad
    if (modalityFilter) {
      filtered = filtered.filter(course => course.modality === modalityFilter)
    }

    setFilteredCourses(filtered)
  }, [courses, searchTerm, modalityFilter])
  
  const fetchCourses = async (status?: string) => {
    const url = status && status !== "all" 
      ? `/api/courses?status=${status}` 
      : "/api/courses"
    const res = await fetch(url)
    if (res.ok) {
      const data = await res.json()
      setCourses(data)
    }
  }
  
  const handleTabChange = (value: string) => {
    setActiveTab(value)
    const statusMap: Record<string, string | undefined> = {
      all: undefined,
      draft: "DRAFT",
      published: "PUBLISHED",
      archived: "ARCHIVED",
    }
    fetchCourses(statusMap[value])
    // Reset filtros al cambiar tab
    setSearchTerm("")
    setModalityFilter(null)
  }

  const handleClearSearch = () => {
    setSearchTerm("")
  }

  const handleClearFilters = () => {
    setSearchTerm("")
    setModalityFilter(null)
  }
  
  const draftCount = initialCourses.filter(c => c.status === "DRAFT").length
  const publishedCount = initialCourses.filter(c => c.status === "PUBLISHED").length
  const archivedCount = initialCourses.filter(c => c.status === "ARCHIVED").length

  // Contar por modalidad
  const modalityCounts = {
    ASYNCHRONOUS: initialCourses.filter(c => c.modality === "ASYNCHRONOUS").length,
    SYNCHRONOUS: initialCourses.filter(c => c.modality === "SYNCHRONOUS").length,
    BLENDED: initialCourses.filter(c => c.modality === "BLENDED").length,
  }

  const hasActiveFilters = searchTerm || modalityFilter
  
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold">Catálogo de Cursos</h1>
        <p className="text-muted-foreground">
          Gestiona cursos, versiones y rutas de aprendizaje
        </p>
      </div>

      {/* Buscador y Filtros */}
      <div className="space-y-3 bg-muted/30 p-4 rounded-lg border">
        <div className="space-y-3">
          {/* Búsqueda */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar por nombre, código u objetivo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchTerm && (
                <button
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
            <label className="text-sm font-medium text-muted-foreground">Modalidad:</label>
            <Select value={modalityFilter || "all"} onValueChange={(value) => setModalityFilter(value === "all" ? null : value)}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Todas las modalidades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las modalidades</SelectItem>
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

            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearFilters}
                className="w-full sm:w-auto"
              >
                <X className="h-4 w-4 mr-2" />
                Limpiar filtros
              </Button>
            )}
          </div>

          {/* Contador de resultados */}
          {(searchTerm || modalityFilter) && (
            <div className="text-xs text-muted-foreground">
              Se encontraron {filteredCourses.length} de {courses.length} cursos
            </div>
          )}
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="all">
            Todos <Badge variant="secondary" className="ml-2">{initialCourses.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="draft">
            Borradores <Badge variant="secondary" className="ml-2">{draftCount}</Badge>
          </TabsTrigger>
          <TabsTrigger value="published">
            Publicados <Badge variant="secondary" className="ml-2">{publishedCount}</Badge>
          </TabsTrigger>
          <TabsTrigger value="archived">
            Archivados <Badge variant="secondary" className="ml-2">{archivedCount}</Badge>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab} className="mt-4">
          <CoursesTable 
            data={filteredCourses} 
            onRefresh={() => fetchCourses(activeTab !== "all" ? activeTab.toUpperCase() : undefined)} 
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
