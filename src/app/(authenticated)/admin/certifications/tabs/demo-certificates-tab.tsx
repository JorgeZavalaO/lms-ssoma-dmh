"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { AlertTriangle, Download, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type RecipientMode = "existing" | "manual"

interface CourseOption {
  id: string
  code: string | null
  name: string
  duration: number | null
  validity: number | null
}

interface CollaboratorOption {
  id: string
  dni: string
  fullName: string
  email: string
}

interface CollaboratorsResponse {
  items?: CollaboratorOption[]
  error?: string
}

function getFileNameFromHeaders(headers: Headers) {
  const disposition = headers.get("Content-Disposition")
  const match = disposition?.match(/filename="([^"]+)"/)
  return match?.[1] ?? "Certificado_Demo.pdf"
}

export function DemoCertificatesTab() {
  const [courses, setCourses] = useState<CourseOption[]>([])
  const [coursesLoading, setCoursesLoading] = useState(true)
  const [courseId, setCourseId] = useState("")
  const [recipientMode, setRecipientMode] =
    useState<RecipientMode>("existing")
  const [collaboratorSearch, setCollaboratorSearch] = useState("")
  const [collaborators, setCollaborators] = useState<CollaboratorOption[]>([])
  const [collaboratorsLoading, setCollaboratorsLoading] = useState(false)
  const [collaboratorId, setCollaboratorId] = useState("")
  const [collaboratorName, setCollaboratorName] = useState("")
  const [collaboratorDni, setCollaboratorDni] = useState("")
  const [score, setScore] = useState("100")
  const [generating, setGenerating] = useState(false)

  const selectedCourse = useMemo(
    () => courses.find((course) => course.id === courseId),
    [courseId, courses]
  )

  const selectedCollaborator = useMemo(
    () =>
      collaborators.find((collaborator) => collaborator.id === collaboratorId),
    [collaboratorId, collaborators]
  )

  const loadCourses = useCallback(async () => {
    try {
      setCoursesLoading(true)
      const response = await fetch("/api/courses?status=PUBLISHED")
      const data = (await response.json()) as CourseOption[] | { error?: string }

      if (!response.ok || !Array.isArray(data)) {
        throw new Error(
          Array.isArray(data)
            ? "Error al cargar cursos"
            : data.error || "Error al cargar cursos"
        )
      }

      setCourses(data)
      setCourseId((current) => current || data[0]?.id || "")
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Error al cargar cursos"
      toast.error(message)
    } finally {
      setCoursesLoading(false)
    }
  }, [])

  const loadCollaborators = useCallback(async (query: string) => {
    try {
      setCollaboratorsLoading(true)
      const params = new URLSearchParams({
        pageSize: "10",
        status: "ACTIVE",
      })

      if (query.trim()) {
        params.set("q", query.trim())
      }

      const response = await fetch(`/api/collaborators?${params.toString()}`)
      const data = (await response.json()) as CollaboratorsResponse

      if (!response.ok) {
        throw new Error(data.error || "Error al cargar colaboradores")
      }

      const items = data.items || []
      setCollaborators(items)
      setCollaboratorId((current) =>
        items.some((collaborator) => collaborator.id === current)
          ? current
          : items[0]?.id || ""
      )
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Error al cargar colaboradores"
      toast.error(message)
    } finally {
      setCollaboratorsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCourses()
  }, [loadCourses])

  useEffect(() => {
    if (recipientMode !== "existing") return

    const timeout = window.setTimeout(() => {
      loadCollaborators(collaboratorSearch)
    }, 250)

    return () => window.clearTimeout(timeout)
  }, [collaboratorSearch, loadCollaborators, recipientMode])

  const canGenerate =
    Boolean(courseId) &&
    score.trim().length > 0 &&
    !Number.isNaN(Number(score)) &&
    Number(score) >= 0 &&
    Number(score) <= 100 &&
    (recipientMode === "manual"
      ? collaboratorName.trim().length >= 3 &&
        collaboratorDni.trim().length >= 8
      : Boolean(collaboratorId))

  const handleGenerate = async () => {
    if (!canGenerate) {
      toast.error("Completa los datos requeridos")
      return
    }

    try {
      setGenerating(true)
      const payload =
        recipientMode === "manual"
          ? {
              courseId,
              recipientMode,
              collaboratorName,
              collaboratorDni,
              score: Number(score),
            }
          : {
              courseId,
              recipientMode,
              collaboratorId,
              score: Number(score),
            }

      const response = await fetch("/api/certificates/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as {
          error?: string
        } | null
        throw new Error(data?.error || "Error al generar certificado demo")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = getFileNameFromHeaders(response.headers)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.setTimeout(() => window.URL.revokeObjectURL(url), 1000)
      toast.success("Certificado demo generado")
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Error al generar certificado demo"
      toast.error(message)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-semibold tracking-tight">
            Certificados demo
          </h2>
          <p className="text-muted-foreground">
            Genera PDFs temporales con cursos publicados.
          </p>
        </div>
        <Button onClick={loadCourses} variant="outline" disabled={coursesLoading}>
          <RefreshCw
            data-icon="inline-start"
            className={coursesLoading ? "animate-spin" : undefined}
          />
          Actualizar
        </Button>
      </div>

      <Alert>
        <AlertTriangle />
        <AlertTitle>Generacion temporal</AlertTitle>
        <AlertDescription>
          El PDF no crea avance, certificacion, notificacion, reporte ni archivo
          persistido.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Datos del certificado</CardTitle>
          <CardDescription>
            Selecciona el curso y el destinatario para emitir el PDF.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
            <div className="flex flex-col gap-2">
              <Label htmlFor="demo-course">Curso</Label>
              <Select
                value={courseId}
                onValueChange={setCourseId}
                disabled={coursesLoading || courses.length === 0}
              >
                <SelectTrigger id="demo-course" className="w-full">
                  <SelectValue
                    placeholder={
                      coursesLoading
                        ? "Cargando cursos..."
                        : "Seleccionar curso"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.code ? `${course.code} - ${course.name}` : course.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              {selectedCourse && (
                <p className="text-sm text-muted-foreground">
                  {selectedCourse.duration || 0} horas
                  {selectedCourse.validity
                    ? ` - vigencia ${selectedCourse.validity} meses`
                    : " - sin vencimiento"}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="demo-score">Calificacion</Label>
              <Input
                id="demo-score"
                type="number"
                min={0}
                max={100}
                value={score}
                onChange={(event) => setScore(event.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Label>Destinatario</Label>
            <RadioGroup
              value={recipientMode}
              onValueChange={(value) => {
                setRecipientMode(value as RecipientMode)
              }}
              className="grid gap-3 md:grid-cols-2"
            >
              <Label
                htmlFor="recipient-existing"
                className="flex cursor-pointer items-start gap-3 rounded-md border p-4"
              >
                <RadioGroupItem id="recipient-existing" value="existing" />
                <span className="flex flex-col gap-1">
                  <span>Colaborador existente</span>
                  <span className="text-sm font-normal text-muted-foreground">
                    Usa nombre y DNI del registro activo.
                  </span>
                </span>
              </Label>
              <Label
                htmlFor="recipient-manual"
                className="flex cursor-pointer items-start gap-3 rounded-md border p-4"
              >
                <RadioGroupItem id="recipient-manual" value="manual" />
                <span className="flex flex-col gap-1">
                  <span>Datos manuales</span>
                  <span className="text-sm font-normal text-muted-foreground">
                    Ingresa nombre y DNI sin asociarlo al sistema.
                  </span>
                </span>
              </Label>
            </RadioGroup>
          </div>

          {recipientMode === "existing" ? (
            <div className="grid gap-4 md:grid-cols-[1fr_1fr]">
              <div className="flex flex-col gap-2">
                <Label htmlFor="collaborator-search">Buscar colaborador</Label>
                <Input
                  id="collaborator-search"
                  value={collaboratorSearch}
                  onChange={(event) => setCollaboratorSearch(event.target.value)}
                  placeholder="Nombre, DNI o email"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="demo-collaborator">Colaborador</Label>
                <Select
                  value={collaboratorId}
                  onValueChange={setCollaboratorId}
                  disabled={collaboratorsLoading || collaborators.length === 0}
                >
                  <SelectTrigger id="demo-collaborator" className="w-full">
                    <SelectValue
                      placeholder={
                        collaboratorsLoading
                          ? "Cargando colaboradores..."
                          : "Seleccionar colaborador"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {collaborators.map((collaborator) => (
                        <SelectItem key={collaborator.id} value={collaborator.id}>
                          {collaborator.fullName} - DNI {collaborator.dni}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                {selectedCollaborator && (
                  <p className="text-sm text-muted-foreground">
                    {selectedCollaborator.email}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
              <div className="flex flex-col gap-2">
                <Label htmlFor="manual-name">Nombre completo</Label>
                <Input
                  id="manual-name"
                  value={collaboratorName}
                  onChange={(event) => setCollaboratorName(event.target.value)}
                  placeholder="Nombre del destinatario"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="manual-dni">DNI</Label>
                <Input
                  id="manual-dni"
                  value={collaboratorDni}
                  onChange={(event) => setCollaboratorDni(event.target.value)}
                  placeholder="Documento"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <Button
              onClick={handleGenerate}
              disabled={!canGenerate || generating || coursesLoading}
            >
              {generating ? (
                <RefreshCw data-icon="inline-start" className="animate-spin" />
              ) : (
                <Download data-icon="inline-start" />
              )}
              Generar PDF
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
