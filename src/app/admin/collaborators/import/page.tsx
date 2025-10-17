"use client"
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, FileDown, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

type Result = { created: number; updated: number; skipped: number; errors: Array<{ row: number; message: string }> }

export default function ImportCollaboratorsPage() {
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<Result | null>(null)
  const [loading, setLoading] = useState(false)
  const [drag, setDrag] = useState(false)
  const ref = useRef<HTMLInputElement>(null)

  async function handleUpload(e?: React.FormEvent) {
    e?.preventDefault()
    if (!file) return
    setLoading(true); setResult(null)
    const fd = new FormData()
    fd.append("file", file)
    const res = await fetch("/api/collaborators/import", { method: "POST", body: fd })
    const json = await res.json()
    setResult(json)
    setLoading(false)
  }

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Importar colaboradores</h1>
        <p className="text-sm text-muted-foreground">Sube un archivo CSV/XLSX con el formato indicado.</p>
      </div>

      <Card className="max-w-3xl">
        <CardHeader><CardTitle>Cargar archivo</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-6 grid place-items-center text-center cursor-pointer transition-colors",
              drag ? "border-primary/50 bg-accent/40" : "border-muted-foreground/20 hover:bg-accent/30"
            )}
            onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDrag(false)
              const f = e.dataTransfer.files?.[0]
              if (f) setFile(f)
            }}
            onClick={() => ref.current?.click()}
            aria-label="Arrastra y suelta tu archivo o haz click para seleccionar"
          >
            <div className="flex flex-col items-center gap-2">
              <Upload className="size-6 text-muted-foreground" />
              <div className="text-sm">
                Arrastra tu archivo aquí o <span className="underline">haz click para seleccionar</span>
              </div>
              <div className="text-xs text-muted-foreground">Formatos: .xlsx, .xls, .csv</div>
              {file && <div className="text-xs mt-2">Seleccionado: <b>{file.name}</b></div>}
            </div>
          </div>

          <input
            ref={ref}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />

          <div className="flex items-center gap-2">
            <Button onClick={() => window.open("/api/collaborators/template?format=xlsx", "_blank")} variant="outline">
              <FileDown className="size-4" /> Descargar template XLSX
            </Button>
            <Button onClick={() => window.open("/api/collaborators/template?format=csv", "_blank")} variant="outline">
              <FileDown className="size-4" /> Descargar template CSV
            </Button>
            <div className="ml-auto" />
            <Button onClick={() => handleUpload()} disabled={!file || loading}>
              {loading ? (<span className="inline-flex items-center gap-2"><Loader2 className="size-4 animate-spin" /> Importando…</span>) : "Importar"}
            </Button>
          </div>

          {result && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-md border p-3">
                  <div className="text-xs text-muted-foreground">Creados</div>
                  <div className="text-2xl font-bold text-green-600">{result.created}</div>
                </div>
                <div className="rounded-md border p-3">
                  <div className="text-xs text-muted-foreground">Actualizados</div>
                  <div className="text-2xl font-bold text-blue-600">{result.updated}</div>
                </div>
                <div className="rounded-md border p-3">
                  <div className="text-xs text-muted-foreground">Omitidos</div>
                  <div className="text-2xl font-bold text-amber-600">{result.skipped}</div>
                </div>
              </div>

              {result.errors?.length > 0 && (
                <div className="rounded-lg border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left px-3 py-2">Fila</th>
                        <th className="text-left px-3 py-2">Mensaje</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {result.errors.map((e, i) => (
                        <tr key={i}>
                          <td className="px-3 py-2">{e.row}</td>
                          <td className="px-3 py-2">{e.message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="text-xs text-muted-foreground">
                Cabeceras esperadas: <b>DNI, Nombres, Email, Area, Puesto, Sede, Estado, FechaIngreso</b>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
