"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Progress } from "@/components/ui/progress"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { FileUp, Plus, Trash2 } from "lucide-react"

const MAX_PDF_SIZE_BYTES = 10 * 1024 * 1024
const MAX_PDF_SIZE_MB = 10

type LessonFormValues = {
  title: string
  description: string
  type: "VIDEO" | "PDF" | "PPT" | "HTML" | "SCORM"
  videoUrl: string
  fileUrl: string
  htmlContent: string
  completionThreshold: number
  duration: number
}

type PdfSourceType = "link" | "upload"

const PDF_URL_REGEX = /\.pdf($|[?#])/i

function isValidPdfUrl(url: string) {
  return PDF_URL_REGEX.test(url)
}

function isPdfFile(file: File) {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
}

function validatePdfFile(file: File) {
  if (!isPdfFile(file)) {
    return "Solo se permiten archivos PDF"
  }

  if (file.size > MAX_PDF_SIZE_BYTES) {
    return `El PDF excede el límite de ${MAX_PDF_SIZE_MB} MB`
  }

  return null
}

async function uploadPdfWithProgress(
  file: File,
  title: string,
  onProgress: (progress: number) => void
) {
  const formData = new FormData()
  formData.append("file", file)
  formData.append("name", title || file.name)
  formData.append("fileType", "PDF")
  formData.append("tags", JSON.stringify(["lesson", "course-content"]))

  return new Promise<string>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open("POST", "/api/files")

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return
      const percent = Math.round((event.loaded / event.total) * 100)
      onProgress(Math.max(0, Math.min(100, percent)))
    }

    xhr.onerror = () => {
      reject(new Error("No se pudo subir el PDF"))
    }

    xhr.onload = () => {
      let response: { blobUrl?: string; error?: string } = {}

      try {
        response = JSON.parse(xhr.responseText || "{}")
      } catch {
        response = {}
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        if (!response.blobUrl) {
          reject(new Error("No se recibió la URL del PDF subido"))
          return
        }

        onProgress(100)
        resolve(response.blobUrl)
        return
      }

      reject(new Error(response.error || "No se pudo subir el PDF"))
    }

    xhr.send(formData)
  })
}

interface PdfUploadDropzoneProps {
  id: string
  file: File | null
  disabled?: boolean
  onFileChange: (file: File | null) => void
}

function PdfUploadDropzone({ id, file, disabled = false, onFileChange }: PdfUploadDropzoneProps) {
  const [dragActive, setDragActive] = React.useState(false)

  const handleFileSelection = (selectedFile: File | null) => {
    if (!selectedFile) {
      onFileChange(null)
      return
    }

    const error = validatePdfFile(selectedFile)
    if (error) {
      toast.error(error)
      return
    }

    onFileChange(selectedFile)
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>Archivo PDF *</Label>
      <Input
        id={id}
        type="file"
        className="sr-only"
        accept="application/pdf,.pdf"
        disabled={disabled}
        onChange={(event) => {
          const selectedFile = event.target.files?.[0] || null
          handleFileSelection(selectedFile)
        }}
      />

      <label
        htmlFor={id}
        onDragEnter={(event) => {
          event.preventDefault()
          if (!disabled) setDragActive(true)
        }}
        onDragOver={(event) => {
          event.preventDefault()
          if (!disabled) setDragActive(true)
        }}
        onDragLeave={(event) => {
          event.preventDefault()
          setDragActive(false)
        }}
        onDrop={(event) => {
          event.preventDefault()
          setDragActive(false)
          if (disabled) return

          const droppedFile = event.dataTransfer.files?.[0] || null
          handleFileSelection(droppedFile)
        }}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-6 text-center transition-colors ${
          dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25"
        } ${disabled ? "cursor-not-allowed opacity-60" : "hover:border-primary/50 hover:bg-primary/5"}`}
      >
        <FileUp className="h-5 w-5 text-muted-foreground" />
        <p className="text-sm font-medium">Arrastra y suelta tu PDF aquí</p>
        <p className="text-xs text-muted-foreground">o haz clic para seleccionar un archivo</p>
        <p className="text-xs text-muted-foreground">Solo PDF, máximo {MAX_PDF_SIZE_MB} MB</p>
      </label>

      {file && (
        <p className="text-xs font-medium text-foreground break-all">
          Archivo seleccionado: {file.name}
        </p>
      )}
    </div>
  )
}

// Create Lesson Dialog
interface CreateLessonDialogProps {
  unitId: string
  onCreated: () => void
}

export function CreateLessonDialog({ unitId, onCreated }: CreateLessonDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [lessonType, setLessonType] = React.useState<string>("VIDEO")
  const [pdfSource, setPdfSource] = React.useState<PdfSourceType>("link")
  const [pdfFile, setPdfFile] = React.useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = React.useState(0)

  const form = useForm<LessonFormValues>({
    defaultValues: {
      title: "",
      description: "",
      type: "VIDEO",
      videoUrl: "",
      fileUrl: "",
      htmlContent: "",
      completionThreshold: 80,
      duration: 0,
    },
  })

  const uploadPdfAndGetUrl = async (title: string) => {
    if (!pdfFile) {
      throw new Error("Selecciona un archivo PDF para continuar")
    }

    const fileError = validatePdfFile(pdfFile)
    if (fileError) {
      throw new Error(fileError)
    }

    setUploadProgress(0)
    return uploadPdfWithProgress(pdfFile, title, setUploadProgress)
  }

  const onSubmit = async (data: LessonFormValues) => {
    setLoading(true)
    try {
      const payload: LessonFormValues = {
        ...data,
        title: data.title.trim(),
        description: data.description.trim(),
        videoUrl: data.videoUrl.trim(),
        fileUrl: data.fileUrl.trim(),
        htmlContent: data.htmlContent.trim(),
      }

      if (payload.type === "PDF") {
        if (pdfSource === "upload") {
          payload.fileUrl = await uploadPdfAndGetUrl(payload.title)
        } else {
          if (!payload.fileUrl) {
            throw new Error("Ingresa un enlace público al PDF")
          }

          if (!isValidPdfUrl(payload.fileUrl)) {
            throw new Error("El enlace debe apuntar a un archivo PDF válido")
          }
        }

        payload.videoUrl = ""
        payload.htmlContent = ""
      }

      if (payload.type === "VIDEO") {
        payload.fileUrl = ""
        payload.htmlContent = ""
      }

      if (payload.type === "HTML") {
        payload.videoUrl = ""
        payload.fileUrl = ""
      }

      const res = await fetch(`/api/units/${unitId}/lessons`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Error creating lesson")
      }

      toast.success("Lección creada exitosamente")
      setOpen(false)
      form.reset()
      setPdfSource("link")
      setPdfFile(null)
      setUploadProgress(0)
      setLessonType("VIDEO")
      onCreated()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error desconocido")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Nueva Lección
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Lección</DialogTitle>
          <DialogDescription>
            Agrega una nueva lección. El orden se asignará automáticamente al final.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                {...form.register("title")}
                placeholder="Título de la lección"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Tipo *</Label>
              <Select
                value={form.watch("type")}
                onValueChange={(value) => {
                  form.setValue("type", value as LessonFormValues["type"])
                  setLessonType(value)

                  if (value !== "PDF") {
                    setPdfSource("link")
                    setPdfFile(null)
                    setUploadProgress(0)
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VIDEO">Video</SelectItem>
                  <SelectItem value="PDF">PDF</SelectItem>
                  <SelectItem value="PPT">Presentación</SelectItem>
                  <SelectItem value="HTML">HTML</SelectItem>
                  <SelectItem value="SCORM">SCORM</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              {...form.register("description")}
              placeholder="Descripción de la lección"
              rows={2}
            />
          </div>

          {/* Campos condicionales según el tipo */}
          {lessonType === "VIDEO" && (
            <div className="space-y-2">
              <Label htmlFor="videoUrl">URL del Video (YouTube/Vimeo)</Label>
              <Input
                id="videoUrl"
                {...form.register("videoUrl")}
                placeholder="https://www.youtube.com/watch?v=..."
                type="url"
              />
            </div>
          )}

          {lessonType === "PDF" && (
            <div className="space-y-3 rounded-md border p-4">
              <div className="space-y-1">
                <Label>Contenido PDF *</Label>
                <p className="text-xs text-muted-foreground">
                  Elige una fuente: sube un PDF (máx. {MAX_PDF_SIZE_MB} MB) o pega un enlace PDF público.
                </p>
              </div>

              <RadioGroup
                value={pdfSource}
                onValueChange={(value) => setPdfSource(value as PdfSourceType)}
                className="grid grid-cols-1 sm:grid-cols-2 gap-3"
              >
                <label className="flex items-start gap-2 rounded-md border p-3 cursor-pointer">
                  <RadioGroupItem value="upload" id="create-pdf-upload" className="mt-0.5" />
                  <span className="space-y-0.5">
                    <span className="block text-sm font-medium">Subir PDF</span>
                    <span className="block text-xs text-muted-foreground">Desde tu equipo</span>
                  </span>
                </label>
                <label className="flex items-start gap-2 rounded-md border p-3 cursor-pointer">
                  <RadioGroupItem value="link" id="create-pdf-link" className="mt-0.5" />
                  <span className="space-y-0.5">
                    <span className="block text-sm font-medium">Pegar enlace PDF</span>
                    <span className="block text-xs text-muted-foreground">URL accesible públicamente</span>
                  </span>
                </label>
              </RadioGroup>

              {pdfSource === "upload" ? (
                <div className="space-y-2">
                  <PdfUploadDropzone
                    id="createPdfFile"
                    file={pdfFile}
                    disabled={loading}
                    onFileChange={(file) => {
                      setPdfFile(file)
                      setUploadProgress(0)
                    }}
                  />

                  {loading && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Subiendo a Blob...</span>
                        <span className="font-medium">{uploadProgress}%</span>
                      </div>
                      <Progress value={uploadProgress} />
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="fileUrl">Enlace del PDF *</Label>
                  <Input
                    id="fileUrl"
                    {...form.register("fileUrl")}
                    placeholder="https://.../archivo.pdf"
                    type="url"
                  />
                </div>
              )}
            </div>
          )}

          {(lessonType === "PPT" || lessonType === "SCORM") && (
            <div className="space-y-2">
              <Label htmlFor="fileUrl">URL del Archivo</Label>
              <Input
                id="fileUrl"
                {...form.register("fileUrl")}
                placeholder="https://..."
                type="url"
              />
            </div>
          )}

          {lessonType === "HTML" && (
            <div className="space-y-2">
              <Label htmlFor="htmlContent">Contenido HTML</Label>
              <Textarea
                id="htmlContent"
                {...form.register("htmlContent")}
                placeholder="<h1>Contenido...</h1>"
                rows={4}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Duración (min)</Label>
              <Input
                id="duration"
                type="number"
                {...form.register("duration", { valueAsNumber: true })}
                min={0}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="completionThreshold">% Completado</Label>
              <Input
                id="completionThreshold"
                type="number"
                {...form.register("completionThreshold", { valueAsNumber: true })}
                min={0}
                max={100}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading
                ? lessonType === "PDF" && pdfSource === "upload"
                  ? "Subiendo PDF y creando..."
                  : "Creando..."
                : "Crear Lección"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Edit Lesson Dialog
interface EditLessonDialogProps {
  lesson: {
    id: string
    title: string
    description: string | null
    type: string
    order: number
    duration: number | null
    completionThreshold: number
    videoUrl: string | null
    fileUrl: string | null
    htmlContent: string | null
  }
  onEdited: () => void
}

export function EditLessonDialog({ lesson, onEdited }: EditLessonDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [lessonType, setLessonType] = React.useState<string>(lesson.type)
  const [pdfSource, setPdfSource] = React.useState<PdfSourceType>("link")
  const [pdfFile, setPdfFile] = React.useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = React.useState(0)

  const form = useForm<LessonFormValues>({
    defaultValues: {
      title: lesson.title,
      description: lesson.description || "",
      type: lesson.type as LessonFormValues["type"],
      duration: lesson.duration || 0,
      completionThreshold: lesson.completionThreshold,
      videoUrl: lesson.videoUrl || "",
      fileUrl: lesson.fileUrl || "",
      htmlContent: lesson.htmlContent || "",
    },
  })

  const uploadPdfAndGetUrl = async (title: string) => {
    if (!pdfFile) {
      throw new Error("Selecciona un archivo PDF para continuar")
    }

    const fileError = validatePdfFile(pdfFile)
    if (fileError) {
      throw new Error(fileError)
    }

    setUploadProgress(0)
    return uploadPdfWithProgress(pdfFile, title, setUploadProgress)
  }

  const onSubmit = async (data: LessonFormValues) => {
    setLoading(true)
    try {
      const payload: LessonFormValues = {
        ...data,
        title: data.title.trim(),
        description: data.description.trim(),
        videoUrl: data.videoUrl.trim(),
        fileUrl: data.fileUrl.trim(),
        htmlContent: data.htmlContent.trim(),
      }

      if (payload.type === "PDF") {
        if (pdfSource === "upload") {
          payload.fileUrl = await uploadPdfAndGetUrl(payload.title)
        } else {
          if (!payload.fileUrl) {
            throw new Error("Ingresa un enlace público al PDF")
          }

          if (!isValidPdfUrl(payload.fileUrl)) {
            throw new Error("El enlace debe apuntar a un archivo PDF válido")
          }
        }

        payload.videoUrl = ""
        payload.htmlContent = ""
      }

      if (payload.type === "VIDEO") {
        payload.fileUrl = ""
        payload.htmlContent = ""
      }

      if (payload.type === "HTML") {
        payload.videoUrl = ""
        payload.fileUrl = ""
      }

      const res = await fetch(`/api/lessons/${lesson.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, order: lesson.order }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Error updating lesson")
      }

      toast.success("Lección actualizada exitosamente")
      setOpen(false)
      setPdfSource("link")
      setPdfFile(null)
      setUploadProgress(0)
      onEdited()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error desconocido")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">Editar</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Lección</DialogTitle>
          <DialogDescription>
            Modifica los datos de la lección. Usa el arrastre para cambiar el orden.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                {...form.register("title")}
                placeholder="Título de la lección"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Tipo *</Label>
              <Select
                value={form.watch("type")}
                onValueChange={(value) => {
                  form.setValue("type", value as LessonFormValues["type"])
                  setLessonType(value)

                  if (value !== "PDF") {
                    setPdfSource("link")
                    setPdfFile(null)
                    setUploadProgress(0)
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VIDEO">Video</SelectItem>
                  <SelectItem value="PDF">PDF</SelectItem>
                  <SelectItem value="PPT">Presentación</SelectItem>
                  <SelectItem value="HTML">HTML</SelectItem>
                  <SelectItem value="SCORM">SCORM</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              {...form.register("description")}
              placeholder="Descripción de la lección"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Duración (min)</Label>
              <Input
                id="duration"
                type="number"
                {...form.register("duration", { valueAsNumber: true })}
                min={0}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="completionThreshold">% Completado</Label>
              <Input
                id="completionThreshold"
                type="number"
                {...form.register("completionThreshold", { valueAsNumber: true })}
                min={0}
                max={100}
              />
            </div>
          </div>

          {lessonType === "VIDEO" && (
            <div className="space-y-2">
              <Label htmlFor="videoUrl">URL del Video</Label>
              <Input
                id="videoUrl"
                {...form.register("videoUrl")}
                placeholder="https://youtube.com/watch?v=... o https://vimeo.com/..."
                type="url"
              />
            </div>
          )}

          {lessonType === "PDF" && (
            <div className="space-y-3 rounded-md border p-4">
              <div className="space-y-1">
                <Label>Contenido PDF *</Label>
                <p className="text-xs text-muted-foreground">
                  Puedes reemplazar el PDF subiendo un archivo nuevo o actualizarlo con un enlace público.
                </p>
              </div>

              <RadioGroup
                value={pdfSource}
                onValueChange={(value) => setPdfSource(value as PdfSourceType)}
                className="grid grid-cols-1 sm:grid-cols-2 gap-3"
              >
                <label className="flex items-start gap-2 rounded-md border p-3 cursor-pointer">
                  <RadioGroupItem value="upload" id="edit-pdf-upload" className="mt-0.5" />
                  <span className="space-y-0.5">
                    <span className="block text-sm font-medium">Subir PDF</span>
                    <span className="block text-xs text-muted-foreground">Reemplaza el actual</span>
                  </span>
                </label>
                <label className="flex items-start gap-2 rounded-md border p-3 cursor-pointer">
                  <RadioGroupItem value="link" id="edit-pdf-link" className="mt-0.5" />
                  <span className="space-y-0.5">
                    <span className="block text-sm font-medium">Pegar enlace PDF</span>
                    <span className="block text-xs text-muted-foreground">URL accesible públicamente</span>
                  </span>
                </label>
              </RadioGroup>

              {pdfSource === "upload" ? (
                <div className="space-y-2">
                  <PdfUploadDropzone
                    id="editPdfFile"
                    file={pdfFile}
                    disabled={loading}
                    onFileChange={(file) => {
                      setPdfFile(file)
                      setUploadProgress(0)
                    }}
                  />

                  {loading && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Subiendo a Blob...</span>
                        <span className="font-medium">{uploadProgress}%</span>
                      </div>
                      <Progress value={uploadProgress} />
                    </div>
                  )}

                  {lesson.fileUrl && (
                    <p className="text-xs text-muted-foreground break-all">
                      Se reemplazará el enlace actual: {lesson.fileUrl}
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="fileUrl">Enlace del PDF *</Label>
                  <Input
                    id="fileUrl"
                    {...form.register("fileUrl")}
                    placeholder="https://.../archivo.pdf"
                    type="url"
                  />
                  {lesson.fileUrl && (
                    <p className="text-xs text-muted-foreground break-all">
                      Enlace actual: {lesson.fileUrl}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {(lessonType === "PPT" || lessonType === "SCORM") && (
            <div className="space-y-2">
              <Label htmlFor="fileUrl">URL del Archivo</Label>
              <Input
                id="fileUrl"
                {...form.register("fileUrl")}
                placeholder="https://..."
                type="url"
              />
            </div>
          )}

          {lessonType === "HTML" && (
            <div className="space-y-2">
              <Label htmlFor="htmlContent">Contenido HTML</Label>
              <Textarea
                id="htmlContent"
                {...form.register("htmlContent")}
                placeholder="<h1>Contenido...</h1>"
                rows={4}
              />
            </div>
          )}

          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading
                ? lessonType === "PDF" && pdfSource === "upload"
                  ? "Subiendo PDF y guardando..."
                  : "Guardando..."
                : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Delete Lesson Dialog
interface DeleteLessonDialogProps {
  lessonId: string
  onDeleted: () => void
}

export function DeleteLessonDialog({ lessonId, onDeleted }: DeleteLessonDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)

  const onConfirm = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/lessons/${lessonId}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Error deleting lesson")
      }

      toast.success("Lección eliminada exitosamente")
      setOpen(false)
      onDeleted()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error desconocido")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Trash2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Eliminar Lección</DialogTitle>
          <DialogDescription>
            ¿Estás seguro? Esta acción eliminará la lección de forma permanente.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={loading}>
            {loading ? "Eliminando..." : "Eliminar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
