"use client"

import { useState } from "react"
import { differenceInDays, format, isFuture } from "date-fns"
import { es } from "date-fns/locale"
import {
  AlertTriangle,
  Award,
  Calendar,
  CheckCircle,
  Clock,
  Download,
  ExternalLink,
  FileText,
  QrCode,
  Shield,
  XCircle,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type CertificateStatus = "VALID" | "EXPIRING" | "EXPIRED" | "REVOKED"

interface Certificate {
  id: string
  courseId: string
  courseName: string
  courseCode: string | null
  courseVersion: number
  certificateNumber: string
  issuedAt: string
  expiresAt: string | null
  isValid: boolean
  effectiveStatus: CertificateStatus
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
}

const statusConfig: Record<
  CertificateStatus,
  {
    label: string
    color: string
    icon: typeof CheckCircle
    variant: "default" | "secondary" | "destructive" | "outline"
  }
> = {
  VALID: {
    label: "Vigente",
    color: "bg-green-500",
    icon: CheckCircle,
    variant: "default",
  },
  EXPIRING: {
    label: "Por Vencer",
    color: "bg-orange-500",
    icon: AlertTriangle,
    variant: "secondary",
  },
  EXPIRED: {
    label: "Vencido",
    color: "bg-red-500",
    icon: XCircle,
    variant: "destructive",
  },
  REVOKED: {
    label: "Revocado",
    color: "bg-slate-500",
    icon: XCircle,
    variant: "outline",
  },
}

function getValidityDescription(cert: Certificate) {
  if (cert.effectiveStatus === "REVOKED") {
    return cert.revocationReason || "Certificado revocado"
  }

  if (!cert.expiresAt) {
    return "Sin fecha de vencimiento"
  }

  const expiryDate = new Date(cert.expiresAt)
  if (cert.effectiveStatus === "EXPIRED") {
    return `Vencio el ${format(expiryDate, "dd/MM/yyyy", { locale: es })}`
  }

  if (cert.effectiveStatus === "EXPIRING") {
    const daysUntilExpiry = differenceInDays(expiryDate, new Date())
    return `Vence en ${Math.max(daysUntilExpiry, 0)} dias`
  }

  return `Valido hasta ${format(expiryDate, "dd/MM/yyyy", { locale: es })}`
}

export function ClientCertificatesView({
  certificates,
}: ClientCertificatesViewProps) {
  const [activeTab, setActiveTab] = useState("vigentes")
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null)
  const [qrDialogOpen, setQrDialogOpen] = useState(false)

  const vigentes = certificates.filter(
    (cert) =>
      cert.effectiveStatus === "VALID" || cert.effectiveStatus === "EXPIRING"
  )
  const vencidos = certificates.filter(
    (cert) => cert.effectiveStatus === "EXPIRED"
  )
  const revocados = certificates.filter(
    (cert) => cert.effectiveStatus === "REVOKED"
  )

  const stats = {
    total: certificates.length,
    vigentes: vigentes.length,
    porVencer: certificates.filter(
      (cert) => cert.effectiveStatus === "EXPIRING"
    ).length,
    vencidos: vencidos.length,
    revocados: revocados.length,
  }

  const ensureVerificationCode = async (cert: Certificate) => {
    if (cert.verificationCode) {
      return cert.verificationCode
    }

    const response = await fetch("/api/certificates/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ certificationId: cert.id }),
    })

    const data = (await response.json()) as {
      verificationCode?: string
      error?: string
    }

    if (!response.ok || !data.verificationCode) {
      throw new Error(data.error || "No se pudo preparar el certificado")
    }

    return data.verificationCode
  }

  const handleDownload = (cert: Certificate) => {
    try {
      window.open(`/api/certificates/${cert.id}/download`, "_blank")
    } catch (error) {
      console.error("Error al descargar certificado:", error)
      alert("Error al descargar el certificado")
    }
  }

  const handleVerify = async (cert: Certificate) => {
    try {
      const verificationCode = await ensureVerificationCode(cert)
      const verifyUrl = `${window.location.origin}/verify/${verificationCode}`
      window.open(verifyUrl, "_blank")
    } catch (error) {
      console.error("Error al verificar certificado:", error)
      alert("No se pudo abrir la verificacion del certificado")
    }
  }

  const handleShowQR = (cert: Certificate) => {
    setSelectedCert(cert)
    setQrDialogOpen(true)
  }

  const renderCertificateCard = (cert: Certificate) => {
    const config = statusConfig[cert.effectiveStatus]
    const Icon = config.icon

    return (
      <Card key={cert.id} className="transition-shadow hover:shadow-lg">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-purple-600" />
                {cert.courseName}
              </CardTitle>
              <CardDescription className="mt-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="rounded bg-accent px-2 py-1 font-mono text-xs">
                    {cert.certificateNumber}
                  </span>
                  <span>|</span>
                  <span>Version {cert.courseVersion}</span>
                  {cert.isRecertification && (
                    <>
                      <span>|</span>
                      <Badge variant="outline" className="text-xs">
                        Recertificacion
                      </Badge>
                    </>
                  )}
                </div>
              </CardDescription>
            </div>
            <Badge variant={config.variant} className="flex items-center gap-1">
              <Icon className="h-3 w-3" />
              {config.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start gap-2">
              <Calendar className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div className="text-sm">
                <p className="text-muted-foreground">Fecha de Emision</p>
                <p className="font-medium">
                  {format(new Date(cert.issuedAt), "dd/MM/yyyy", { locale: es })}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Clock className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div className="text-sm">
                <p className="text-muted-foreground">Vigencia</p>
                <p className="font-medium">{getValidityDescription(cert)}</p>
              </div>
            </div>
          </div>

          {cert.revokedAt && cert.revocationReason && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm">
              <p className="font-medium text-red-900">Certificado Revocado</p>
              <p className="mt-1 text-xs text-red-700">{cert.revocationReason}</p>
              <p className="mt-1 text-xs text-red-600">
                Revocado el{" "}
                {format(new Date(cert.revokedAt), "dd/MM/yyyy HH:mm", {
                  locale: es,
                })}
              </p>
            </div>
          )}

          {cert.recertificationDueAt &&
            isFuture(new Date(cert.recertificationDueAt)) && (
              <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <div>
                  <p className="font-medium text-amber-900">
                    Recertificacion Requerida
                  </p>
                  <p className="text-xs text-amber-700">
                    Debes recertificar antes del{" "}
                    {format(new Date(cert.recertificationDueAt), "dd/MM/yyyy", {
                      locale: es,
                    })}
                  </p>
                </div>
              </div>
            )}

          <div className="flex flex-wrap gap-2 pt-2">
            <Button onClick={() => handleDownload(cert)} variant="default" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Descargar PDF
            </Button>
            <Button onClick={() => handleVerify(cert)} variant="outline" size="sm">
              <ExternalLink className="mr-2 h-4 w-4" />
              Verificar
            </Button>
            {cert.qrCode && (
              <Button onClick={() => handleShowQR(cert)} variant="outline" size="sm">
                <QrCode className="mr-2 h-4 w-4" />
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mis Certificados</h1>
        <p className="mt-2 text-muted-foreground">
          Consulta y descarga tus certificados de cursos completados
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Award className="h-4 w-4 text-purple-500" />
              Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              Certificados obtenidos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Vigentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.vigentes}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Certificados activos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              Por Vencer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats.porVencer}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Proximos a expirar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <XCircle className="h-4 w-4 text-red-500" />
              Vencidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.vencidos}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Requieren renovacion
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="vigentes">
            Vigentes ({stats.vigentes})
          </TabsTrigger>
          <TabsTrigger value="vencidos">
            Vencidos ({stats.vencidos})
          </TabsTrigger>
          <TabsTrigger value="historial">Historial Completo</TabsTrigger>
        </TabsList>

        <TabsContent value="vigentes" className="mt-6">
          {vigentes.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Award className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-semibold">
                  No hay certificados vigentes
                </h3>
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

        <TabsContent value="vencidos" className="mt-6">
          {vencidos.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle className="mx-auto mb-4 h-12 w-12 text-green-500" />
                <h3 className="mb-2 text-lg font-semibold">
                  Todos tus certificados estan vigentes
                </h3>
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

        <TabsContent value="historial" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Historial Completo de Certificados</CardTitle>
              <CardDescription>
                Todos tus certificados ordenados por fecha de emision
              </CardDescription>
            </CardHeader>
            <CardContent>
              {certificates.length === 0 ? (
                <div className="py-12 text-center">
                  <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="mb-2 text-lg font-semibold">Sin certificados</h3>
                  <p className="text-muted-foreground">
                    Aun no has obtenido ningun certificado
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {certificates.map((cert) => {
                    const config = statusConfig[cert.effectiveStatus]
                    const Icon = config.icon

                    return (
                      <div
                        key={cert.id}
                        className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-accent"
                      >
                        <div className="flex flex-1 items-center gap-4">
                          <div className={`rounded-full p-2 ${config.color} bg-opacity-10`}>
                            <Icon
                              className={`h-5 w-5 ${config.color.replace("bg-", "text-")}`}
                            />
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold">{cert.courseName}</div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span className="font-mono text-xs">
                                {cert.certificateNumber}
                              </span>
                              <span>|</span>
                              <span>Version {cert.courseVersion}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-center">
                            <div className="text-sm text-muted-foreground">
                              Emision
                            </div>
                            <div className="font-medium">
                              {format(new Date(cert.issuedAt), "dd/MM/yyyy")}
                            </div>
                          </div>
                          <div className="min-w-[100px] text-center">
                            <div className="text-sm text-muted-foreground">
                              Estado
                            </div>
                            <Badge variant={config.variant} className="mt-1">
                              {config.label}
                            </Badge>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleDownload(cert)}
                              variant="outline"
                              size="sm"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              onClick={() => handleVerify(cert)}
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

      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Codigo QR de Verificacion</DialogTitle>
            <DialogDescription>
              Escanea este codigo para verificar la autenticidad del certificado
            </DialogDescription>
          </DialogHeader>
          {selectedCert && selectedCert.qrCode && (
            <div className="flex flex-col items-center gap-4 py-4">
              <img
                src={selectedCert.qrCode}
                alt="QR Code"
                className="h-64 w-64 rounded-lg border"
              />
              <div className="text-center">
                <p className="text-sm font-medium">{selectedCert.courseName}</p>
                <p className="mt-1 font-mono text-xs text-muted-foreground">
                  {selectedCert.certificateNumber}
                </p>
              </div>
              <div className="text-center text-xs text-muted-foreground">
                <p>Codigo de verificacion:</p>
                <p className="mt-1 font-mono font-semibold">
                  {selectedCert.verificationCode}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
