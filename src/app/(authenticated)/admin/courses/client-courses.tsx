"use client"

import * as React from "react"
import { CoursesTable } from "./table"
import { 
  CoursesHeader, 
  CoursesFilter, 
  CourseStats, 
  CoursesTabs 
} from "@/components/courses"

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

  // Conteos
  const draftCount = initialCourses.filter(c => c.status === "DRAFT").length
  const publishedCount = initialCourses.filter(c => c.status === "PUBLISHED").length
  const archivedCount = initialCourses.filter(c => c.status === "ARCHIVED").length

  // Contar por modalidad
  const modalityCounts = {
    ASYNCHRONOUS: initialCourses.filter(c => c.modality === "ASYNCHRONOUS").length,
    SYNCHRONOUS: initialCourses.filter(c => c.modality === "SYNCHRONOUS").length,
    BLENDED: initialCourses.filter(c => c.modality === "BLENDED").length,
  }

  const hasActiveFilters = !!searchTerm || !!modalityFilter
  
  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <CoursesHeader 
        totalCourses={initialCourses.length}
        publishedCount={publishedCount}
      />

      {/* Stats Grid */}
      <CourseStats 
        totalCount={initialCourses.length}
        draftCount={draftCount}
        publishedCount={publishedCount}
        archivedCount={archivedCount}
        activeTab={activeTab}
      />

      {/* Filtros */}
      <CoursesFilter 
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        modalityFilter={modalityFilter}
        onModalityChange={setModalityFilter}
        modalityCounts={modalityCounts}
        filteredCount={filteredCourses.length}
        totalCount={courses.length}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={() => {
          setSearchTerm("")
          setModalityFilter(null)
        }}
      />
      
      {/* Tabs y Tabla */}
      <CoursesTabs
        activeTab={activeTab}
        onTabChange={handleTabChange}
        totalCount={initialCourses.length}
        draftCount={draftCount}
        publishedCount={publishedCount}
        archivedCount={archivedCount}
      >
        <CoursesTable 
          data={filteredCourses} 
          onRefresh={() => fetchCourses(activeTab !== "all" ? activeTab.toUpperCase() : undefined)} 
        />
      </CoursesTabs>
    </div>
  )
}
