"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { CheckCircle, AlertCircle, Clock, Search, Download, RefreshCw, Award, XCircle, RotateCcw } from "lucide-react"
import { format, differenceInDays, addMonths } from "date-fns"
import { es } from "date-fns/locale"
import { toast } from "sonner"

interface Certification {
  id: string
  collaborator: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  course: {
    id: string
    name: string
    code: string
    validityMonths: number | null
  }
  issuedAt: string
  expiresAt: string | null
  revokedAt: string | null
  revokedBy: string | null
  revocationReason: string | null
}

interface CertStats {
  valid: number
  expiringSoon: number
  expired: number
  revoked: number
}

export function ClientCertifications() {
  const [certifications, setCertifications] = useState<Certification[]>([])
  const [stats, setStats] = useState<CertStats>({ valid: 0, expiringSoon: 0, expired: 0, revoked: 0 })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false)
  const [recertifyDialogOpen, setRecertifyDialogOpen] = useState(false)
  const [selectedCert, setSelectedCert] = useState<Certification | null>(null)
  const [revocationReason, setRevocationReason] = useState("")
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    loadCertifications()
  }, [])

  const loadCertifications = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/progress/certifications")
      if (response.ok) {
        const data = await response.json()
        setCertifications(data.certifications || [])
        calculateStats(data.certifications || [])
      }
    } catch (error) {
      console.error("Error loading certifications:", error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (certs: Certification[]) => {
    const now = new Date()
    const stats: CertStats = {
      valid: 0,
      expiringSoon: 0,
      expired: 0,
      revoked: 0,
    }

    certs.forEach(cert => {
      if (cert.revokedAt) {
        stats.revoked++
      } else if (cert.expiresAt) {
        const expiryDate = new Date(cert.expiresAt)
        const daysUntilExpiry = differenceInDays(expiryDate, now)
        
        if (daysUntilExpiry < 0) {
          stats.expired++
        } else if (daysUntilExpiry <= 30) {
          stats.expiringSoon++
        } else {
          stats.valid++
        }
      } else {
        stats.valid++
      }
    })

    setStats(stats)
  }

  const getCertStatus = (cert: Certification) => {
    if (cert.revokedAt) return "revoked"
    if (!cert.expiresAt) return "valid"
    
    const now = new Date()
    const expiryDate = new Date(cert.expiresAt)
    const daysUntilExpiry = differenceInDays(expiryDate, now)
    
    if (daysUntilExpiry < 0) return "expired"
    if (daysUntilExpiry <= 30) return "expiring"
    return "valid"
  }

  const statusConfig = {
    valid: { label: "Vigente", color: "bg-green-500", icon: CheckCircle },
    expiring: { label: "Por Vencer", color: "bg-yellow-500", icon: Clock },
    expired: { label: "Vencida", color: "bg-red-500", icon: AlertCircle },
    revoked: { label: "Revocada", color: "bg-gray-500", icon: XCircle },
  }

  const filteredCertifications = certifications.filter(cert => {
    const matchesSearch = 
      cert.collaborator.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.collaborator.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.collaborator.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.course.code.toLowerCase().includes(searchTerm.toLowerCase())
    
    const certStatus = getCertStatus(cert)
    const matchesStatus = statusFilter === "all" || certStatus === statusFilter

    return matchesSearch && matchesStatus
  })

  const handleRevoke = async () => {
    if (!selectedCert || !revocationReason.trim()) {
      toast.error("Debes proporcionar un motivo de revocación")
      return
    }

    try {
      setProcessing(true)
      const response = await fetch(`/api/progress/certifications/${selectedCert.id}/revoke`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: revocationReason }),
      })

      if (response.ok) {
        toast.success("La certificación ha sido revocada exitosamente")
        setRevokeDialogOpen(false)
        setRevocationReason("")
        setSelectedCert(null)
        loadCertifications()
      } else {
        const error = await response.json()
        toast.error(error.error || "No se pudo revocar la certificación")
      }
    } catch (error) {
      console.error("Error revoking certification:", error)
      toast.error("Ocurrió un error al revocar la certificación")
    } finally {
      setProcessing(false)
    }
  }

  const handleRecertify = async () => {
    if (!selectedCert) return

    try {
      setProcessing(true)
      const response = await fetch(`/api/progress/certifications/${selectedCert.id}/recertify`, {
        method: "POST",
      })

      if (response.ok) {
        toast.success("Se ha generado una nueva certificación")
        setRecertifyDialogOpen(false)
        setSelectedCert(null)
        loadCertifications()
      } else {
        const error = await response.json()
        toast.error(error.error || "No se pudo recertificar")
      }
    } catch (error) {
      console.error("Error recertifying:", error)
      toast.error("Ocurrió un error al recertificar")
    } finally {
      setProcessing(false)
    }
  }

  const exportToCSV = () => {
    const headers = ["Colaborador", "Email", "Curso", "Código", "Estado", "Fecha Emisión", "Fecha Vencimiento", "Días Restantes"]
    const rows = filteredCertifications.map(cert => {
      const status = getCertStatus(cert)
      const daysRemaining = cert.expiresAt ? differenceInDays(new Date(cert.expiresAt), new Date()) : "N/A"
      
      return [
        `${cert.collaborator.firstName} ${cert.collaborator.lastName}`,
        cert.collaborator.email,
        cert.course.name,
        cert.course.code,
        statusConfig[status as keyof typeof statusConfig].label,
        format(new Date(cert.issuedAt), "dd/MM/yyyy", { locale: es }),
        cert.expiresAt ? format(new Date(cert.expiresAt), "dd/MM/yyyy", { locale: es }) : "Sin vencimiento",
        daysRemaining.toString(),
      ]
    })

    const csvContent = [headers, ...rows].map(row => row.join(",")).join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `certificaciones-${format(new Date(), "yyyy-MM-dd")}.csv`
    link.click()
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Certificaciones</h1>
          <p className="text-muted-foreground mt-2">
            Gestiona las certificaciones y recertificaciones de los colaboradores
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadCertifications} variant="outline" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
          <Button onClick={exportToCSV} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Vigentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.valid}</div>
            <p className="text-xs text-muted-foreground mt-1">Válidas actualmente</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Por Vencer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.expiringSoon}</div>
            <p className="text-xs text-muted-foreground mt-1">En 30 días</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Vencidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.expired}</div>
            <p className="text-xs text-muted-foreground mt-1">Requieren recertificación</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Revocadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats.revoked}</div>
            <p className="text-xs text-muted-foreground mt-1">Certificados anulados</p>
          </CardContent>
        </Card>
      </div>

      {/* Certifications Table */}
      <Card>
        <CardHeader>
          <CardTitle>Registro de Certificaciones</CardTitle>
          <CardDescription>
            Historial completo de certificados emitidos, vencidos y recertificados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por colaborador, email o curso..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="valid">Vigente</SelectItem>
                <SelectItem value="expiring">Por Vencer</SelectItem>
                <SelectItem value="expired">Vencida</SelectItem>
                <SelectItem value="revoked">Revocada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Colaborador</TableHead>
                  <TableHead>Curso</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha Emisión</TableHead>
                  <TableHead>Fecha Vencimiento</TableHead>
                  <TableHead>Días Restantes</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Cargando certificaciones...</p>
                    </TableCell>
                  </TableRow>
                ) : filteredCertifications.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <Award className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        {searchTerm || statusFilter !== "all" 
                          ? "No se encontraron certificaciones con los filtros aplicados"
                          : "No hay certificaciones emitidas todavía"}
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCertifications.map((cert) => {
                    const status = getCertStatus(cert)
                    const config = statusConfig[status as keyof typeof statusConfig]
                    const Icon = config.icon
                    const daysRemaining = cert.expiresAt ? differenceInDays(new Date(cert.expiresAt), new Date()) : null

                    return (
                      <TableRow key={cert.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {cert.collaborator.firstName} {cert.collaborator.lastName}
                            </div>
                            <div className="text-xs text-muted-foreground">{cert.collaborator.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{cert.course.name}</div>
                            <div className="text-xs text-muted-foreground">{cert.course.code}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={config.color}>
                            <Icon className="h-3 w-3 mr-1" />
                            {config.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {format(new Date(cert.issuedAt), "dd/MM/yyyy", { locale: es })}
                        </TableCell>
                        <TableCell>
                          {cert.expiresAt
                            ? format(new Date(cert.expiresAt), "dd/MM/yyyy", { locale: es })
                            : <span className="text-muted-foreground">Sin vencimiento</span>}
                        </TableCell>
                        <TableCell>
                          {daysRemaining !== null ? (
                            <span className={daysRemaining < 0 ? "text-red-600 font-medium" : daysRemaining <= 30 ? "text-yellow-600 font-medium" : ""}>
                              {daysRemaining < 0 ? `Vencida hace ${Math.abs(daysRemaining)} días` : `${daysRemaining} días`}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {!cert.revokedAt && (
                              <>
                                {status === "expired" && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedCert(cert)
                                      setRecertifyDialogOpen(true)
                                    }}
                                  >
                                    <RotateCcw className="h-4 w-4 mr-1" />
                                    Recertificar
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => {
                                    setSelectedCert(cert)
                                    setRevokeDialogOpen(true)
                                  }}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Revocar
                                </Button>
                              </>
                            )}
                            {cert.revokedAt && (
                              <span className="text-xs text-muted-foreground">
                                Revocada el {format(new Date(cert.revokedAt), "dd/MM/yyyy", { locale: es })}
                              </span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Revoke Dialog */}
      <Dialog open={revokeDialogOpen} onOpenChange={setRevokeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revocar Certificación</DialogTitle>
            <DialogDescription>
              Esta acción revocará permanentemente la certificación de {selectedCert?.collaborator.firstName} {selectedCert?.collaborator.lastName} para el curso {selectedCert?.course.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Motivo de Revocación *</Label>
              <Textarea
                id="reason"
                placeholder="Describe el motivo por el cual se revoca esta certificación..."
                value={revocationReason}
                onChange={(e) => setRevocationReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRevokeDialogOpen(false)} disabled={processing}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleRevoke} disabled={processing || !revocationReason.trim()}>
              {processing ? "Revocando..." : "Revocar Certificación"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Recertify Dialog */}
      <Dialog open={recertifyDialogOpen} onOpenChange={setRecertifyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Recertificar</DialogTitle>
            <DialogDescription>
              Se generará una nueva certificación para {selectedCert?.collaborator.firstName} {selectedCert?.collaborator.lastName} en el curso {selectedCert?.course.name}.
              {selectedCert?.course.validityMonths && (
                <span className="block mt-2">
                  La nueva certificación será válida por {selectedCert.course.validityMonths} meses.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRecertifyDialogOpen(false)} disabled={processing}>
              Cancelar
            </Button>
            <Button onClick={handleRecertify} disabled={processing}>
              {processing ? "Procesando..." : "Confirmar Recertificación"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
