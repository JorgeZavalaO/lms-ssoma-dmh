"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Download, Loader2 } from "lucide-react"
import { toast } from "sonner"

export function ExportCollaboratorsButton() {
  const [loading, setLoading] = React.useState(false)

  const handleExport = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/collaborators/export?format=xlsx")
      if (!response.ok) throw new Error("Error al descargar")

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `colaboradores_${new Date().toISOString().split("T")[0]}.xlsx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast.success("Colaboradores descargados exitosamente")
    } catch (error) {
      console.error("Error al exportar:", error)
      toast.error("Error al descargar colaboradores")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      onClick={handleExport}
      disabled={loading}
      className="gap-2"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      Descargar Excel
    </Button>
  )
}
