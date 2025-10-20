"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Award,
  Download,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Calendar,
  FileText,
  QrCode,
  ExternalLink,
  Shield,
  Clock,
} from "lucide-react"
import { format, differenceInDays, isPast, isFuture } from "date-fns"
import { es } from "date-fns/locale"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface Certificate {
  id: string
  courseId: string
  courseName: string
  courseCode: string
  courseVersion: number
  certificateNumber: string
  issuedAt: string
  expiresAt: string | null
  isValid: boolean
  revokedAt: string | null
  revocationReason: string | null
  pdfUrl: string | null
  verificationCode: string | null
  qrCode: string | null
  isRecertification: boolean
  recertificationDueAt: string | null
}

interface ClientCertificatesViewProps {
  certificates: Certificate[]
  collaboratorId: string
}

const getValidityStatus = (cert: Certificate) => {
  if (!cert.isValid || cert.revokedAt) {
    return {
      label: "Revocado",
      color: "bg-gray-500",
      icon: XCircle,
      variant: "outline" as const,
      description: cert.revocationReason || "Certificado revocado",
    }
  }

  if (!cert.expiresAt) {
    return {
      label: "Vigente",
      color: "bg-green-500",
      icon: CheckCircle,
      variant: "default" as const,
      description: "Sin fecha de vencimiento",
    }
  }

  const expiryDate = new Date(cert.expiresAt)
  const daysUntilExpiry = differenceInDays(expiryDate, new Date())

  if (isPast(expiryDate)) {
    return {
      label: "Vencido",
      color: "bg-red-500",
      icon: XCircle,
      variant: "destructive" as const,
      description: `Venció el ${format(expiryDate, "dd/MM/yyyy", { locale: es })}`,
    }
  }

  if (daysUntilExpiry <= 30) {
    return {
      label: "Por Vencer",
      color: "bg-orange-500",
      icon: AlertTriangle,
      variant: "secondary" as const,
      description: `Vence en ${daysUntilExpiry} días`,
    }
  }

  return {
    label: "Vigente",
    color: "bg-green-500",
    icon: CheckCircle,
    variant: "default" as const,
    description: `Válido hasta ${format(expiryDate, "dd/MM/yyyy", { locale: es })}`,
  }
}

export function ClientCertificatesView({ certificates, collaboratorId }: ClientCertificatesViewProps) {
  const [activeTab, setActiveTab] = useState("vigentes")
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null)
  const [qrDialogOpen, setQrDialogOpen] = useState(false)

  // Clasificar certificados
  const vigentes = certificates.filter((cert) => {
    const status = getValidityStatus(cert)
    return status.label === "Vigente" || status.label === "Por Vencer"
  })

  const vencidos = certificates.filter((cert) => {
    const status = getValidityStatus(cert)
    return status.label === "Vencido"
  })

  const revocados = certificates.filter((cert) => cert.revokedAt !== null)

  // Estadísticas
  const stats = {
    total: certificates.length,
    vigentes: vigentes.length,
    porVencer: certificates.filter((cert) => getValidityStatus(cert).label === "Por Vencer").length,
    vencidos: vencidos.length,
    revocados: revocados.length,
  }

  const handleDownload = async (cert: Certificate) => {
    if (!cert.pdfUrl) {
      alert("No hay certificado PDF disponible")
      return
    }

    try {
      // Abrir el PDF en una nueva pestaña
      window.open(cert.pdfUrl, "_blank")
    } catch (error) {
      console.error("Error al descargar certificado:", error)
      alert("Error al descargar el certificado")
    }
  }

  const handleVerify = (cert: Certificate) => {
    if (!cert.verificationCode) {
      alert("No hay código de verificación disponible")
      return
    }

    // Abrir página de verificación pública
    const verifyUrl = `${window.location.origin}/verify/${cert.verificationCode}`
    window.open(verifyUrl, "_blank")
  }

  const handleShowQR = (cert: Certificate) => {
    setSelectedCert(cert)
    setQrDialogOpen(true)
  }

  const renderCertificateCard = (cert: Certificate) => {
    const status = getValidityStatus(cert)
    const Icon = status.icon

    return (
      <Card key={cert.id} className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-purple-600" />
                {cert.courseName}
              </CardTitle>
              <CardDescription className="mt-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-mono text-xs bg-accent px-2 py-1 rounded">
                    {cert.certificateNumber}
                  </span>
                  <span>•</span>
                  <span>Versión {cert.courseVersion}</span>
                  {cert.isRecertification && (
                    <>
                      <span>•</span>
                      <Badge variant="outline" className="text-xs">
                        Recertificación
                      </Badge>
                    </>
                  )}
                </div>
              </CardDescription>
            </div>
            <Badge variant={status.variant} className="flex items-center gap-1">
              <Icon className="h-3 w-3" />
              {status.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Información de fechas */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div className="text-sm">
                <p className="text-muted-foreground">Fecha de Emisión</p>
                <p className="font-medium">
                  {format(new Date(cert.issuedAt), "dd/MM/yyyy", { locale: es })}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div className="text-sm">
                <p className="text-muted-foreground">Vigencia</p>
                <p className="font-medium">{status.description}</p>
              </div>
            </div>
          </div>

          {/* Mensaje de revocación */}
          {cert.revokedAt && cert.revocationReason && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm">
              <p className="text-red-900 font-medium">Certificado Revocado</p>
              <p className="text-red-700 text-xs mt-1">{cert.revocationReason}</p>
              <p className="text-red-600 text-xs mt-1">
                Revocado el {format(new Date(cert.revokedAt), "dd/MM/yyyy HH:mm", { locale: es })}
              </p>
            </div>
          )}

          {/* Advertencia de recertificación */}
          {cert.recertificationDueAt && isFuture(new Date(cert.recertificationDueAt)) && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <div>
                <p className="text-amber-900 font-medium">Recertificación Requerida</p>
                <p className="text-amber-700 text-xs">
                  Debes recertificar antes del{" "}
                  {format(new Date(cert.recertificationDueAt), "dd/MM/yyyy", { locale: es })}
                </p>
              </div>
            </div>
          )}

          {/* Acciones */}
          <div className="flex flex-wrap gap-2 pt-2">
            <Button
              onClick={() => handleDownload(cert)}
              disabled={!cert.pdfUrl}
              variant="default"
              size="sm"
            >
              <Download className="h-4 w-4 mr-2" />
              Descargar PDF
            </Button>
            <Button
              onClick={() => handleVerify(cert)}
              disabled={!cert.verificationCode}
              variant="outline"
              size="sm"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Verificar
            </Button>
            {cert.qrCode && (
              <Button onClick={() => handleShowQR(cert)} variant="outline" size="sm">
                <QrCode className="h-4 w-4 mr-2" />
                Ver QR
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mis Certificados</h1>
        <p className="text-muted-foreground mt-2">
          Consulta y descarga tus certificados de cursos completados
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Award className="h-4 w-4 text-purple-500" />
              Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">Certificados obtenidos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Vigentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.vigentes}</div>
            <p className="text-xs text-muted-foreground mt-1">Certificados activos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              Por Vencer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.porVencer}</div>
            <p className="text-xs text-muted-foreground mt-1">Próximos a expirar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              Vencidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.vencidos}</div>
            <p className="text-xs text-muted-foreground mt-1">Requieren renovación</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="vigentes">Vigentes ({stats.vigentes})</TabsTrigger>
          <TabsTrigger value="vencidos">Vencidos ({stats.vencidos})</TabsTrigger>
          <TabsTrigger value="historial">Historial Completo</TabsTrigger>
        </TabsList>

        {/* TAB: Vigentes */}
        <TabsContent value="vigentes" className="mt-6">
          {vigentes.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Award className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No hay certificados vigentes</h3>
                <p className="text-muted-foreground">
                  Completa cursos para obtener certificados
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {vigentes.map((cert) => renderCertificateCard(cert))}
            </div>
          )}
        </TabsContent>

        {/* TAB: Vencidos */}
        <TabsContent value="vencidos" className="mt-6">
          {vencidos.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                <h3 className="text-lg font-semibold mb-2">Todos tus certificados están vigentes</h3>
                <p className="text-muted-foreground">
                  No hay certificados vencidos en este momento
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {vencidos.map((cert) => renderCertificateCard(cert))}
            </div>
          )}
        </TabsContent>

        {/* TAB: Historial Completo */}
        <TabsContent value="historial" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Historial Completo de Certificados</CardTitle>
              <CardDescription>
                Todos tus certificados ordenados por fecha de emisión
              </CardDescription>
            </CardHeader>
            <CardContent>
              {certificates.length === 0 ? (
                <div className="py-12 text-center">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Sin certificados</h3>
                  <p className="text-muted-foreground">
                    Aún no has obtenido ningún certificado
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {certificates.map((cert) => {
                    const status = getValidityStatus(cert)
                    const Icon = status.icon

                    return (
                      <div
                        key={cert.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div className={`p-2 rounded-full ${status.color} bg-opacity-10`}>
                            <Icon className={`h-5 w-5 ${status.color.replace("bg-", "text-")}`} />
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold">{cert.courseName}</div>
                            <div className="text-sm text-muted-foreground flex items-center gap-2">
                              <span className="font-mono text-xs">{cert.certificateNumber}</span>
                              <span>•</span>
                              <span>Versión {cert.courseVersion}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-center">
                            <div className="text-sm text-muted-foreground">Emisión</div>
                            <div className="font-medium">
                              {format(new Date(cert.issuedAt), "dd/MM/yyyy")}
                            </div>
                          </div>
                          <div className="text-center min-w-[100px]">
                            <div className="text-sm text-muted-foreground">Estado</div>
                            <Badge variant={status.variant} className="mt-1">
                              {status.label}
                            </Badge>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleDownload(cert)}
                              disabled={!cert.pdfUrl}
                              variant="outline"
                              size="sm"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              onClick={() => handleVerify(cert)}
                              disabled={!cert.verificationCode}
                              variant="outline"
                              size="sm"
                            >
                              <Shield className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog para mostrar QR */}
      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Código QR de Verificación</DialogTitle>
            <DialogDescription>
              Escanea este código para verificar la autenticidad del certificado
            </DialogDescription>
          </DialogHeader>
          {selectedCert && selectedCert.qrCode && (
            <div className="flex flex-col items-center gap-4 py-4">
              <img
                src={selectedCert.qrCode}
                alt="QR Code"
                className="w-64 h-64 border rounded-lg"
              />
              <div className="text-center">
                <p className="text-sm font-medium">{selectedCert.courseName}</p>
                <p className="text-xs text-muted-foreground font-mono mt-1">
                  {selectedCert.certificateNumber}
                </p>
              </div>
              <div className="text-xs text-muted-foreground text-center">
                <p>Código de verificación:</p>
                <p className="font-mono font-semibold mt-1">{selectedCert.verificationCode}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
