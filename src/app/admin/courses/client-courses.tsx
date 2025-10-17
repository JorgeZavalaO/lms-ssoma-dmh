"use client"

import * as React from "react"
import { CoursesTable } from "./table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

interface ClientCoursesProps {
  initialCourses: {
    id: string
    code: string
    name: string
    status: string
    [key: string]: unknown
  }[]
}

export function ClientCourses({ initialCourses }: ClientCoursesProps) {
  const [courses, setCourses] = React.useState(initialCourses)
  const [activeTab, setActiveTab] = React.useState("all")
  
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
  }
  
  const draftCount = initialCourses.filter(c => c.status === "DRAFT").length
  const publishedCount = initialCourses.filter(c => c.status === "PUBLISHED").length
  const archivedCount = initialCourses.filter(c => c.status === "ARCHIVED").length
  
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold">Catálogo de Cursos</h1>
        <p className="text-muted-foreground">
          Gestiona cursos, versiones y rutas de aprendizaje
        </p>
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
            data={courses} 
            onRefresh={() => fetchCourses(activeTab !== "all" ? activeTab.toUpperCase() : undefined)} 
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
