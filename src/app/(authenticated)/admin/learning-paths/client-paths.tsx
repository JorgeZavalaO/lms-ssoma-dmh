"use client"

import * as React from "react"
import { LearningPathsTable } from "./table"

interface ClientLearningPathsProps {
  initialPaths: {
    id: string
    code: string
    name: string
    [key: string]: unknown
  }[]
}

export function ClientLearningPaths({ initialPaths }: ClientLearningPathsProps) {
  const [paths, setPaths] = React.useState(initialPaths)
  
  const fetchPaths = async () => {
    const res = await fetch("/api/learning-paths")
    if (res.ok) {
      const data = await res.json()
      setPaths(data)
    }
  }
  
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold">Rutas de Aprendizaje</h1>
        <p className="text-muted-foreground">
          Gestiona itinerarios de cursos con prerequisitos y secuencias
        </p>
      </div>
      
      <LearningPathsTable data={paths} onRefresh={fetchPaths} />
    </div>
  )
}
