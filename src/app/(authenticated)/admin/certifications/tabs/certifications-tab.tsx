"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Download, RefreshCw } from "lucide-react"
import { differenceInDays, format } from "date-fns"
import { es } from "date-fns/locale"
import { toast } from "sonner"
import { CertificationStatsCards } from "@/components/admin/certifications/certification-stats-cards"
import {
  CertificationStatus,
  CertificationStatusFilter,
  CertificationStats,
  Certification,
  certificationStatusConfig,
} from "@/components/admin/certifications/types"
import { CertificationsTable } from "@/components/admin/certifications/certifications-table"
import { RevokeCertificationDialog } from "@/components/admin/certifications/revoke-certification-dialog"
import { RecertifyCertificationDialog } from "@/components/admin/certifications/recertify-certification-dialog"

export function ClientCertifications() {
  const [certifications, setCertifications] = useState<Certification[]>([])
  const [stats, setStats] = useState<CertificationStats>({ valid: 0, expiringSoon: 0, expired: 0, revoked: 0 })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<CertificationStatusFilter>("all")
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false)
  const [recertifyDialogOpen, setRecertifyDialogOpen] = useState(false)
  const [selectedCert, setSelectedCert] = useState<Certification | null>(null)
  const [revocationReason, setRevocationReason] = useState("")
  const [processing, setProcessing] = useState(false)

  const getCertStatus = useCallback((cert: Certification): CertificationStatus => {
    if (cert.revokedAt) return "revoked"
    if (!cert.expiresAt) return "valid"

    const now = new Date()
    const expiryDate = new Date(cert.expiresAt)
    const daysUntilExpiry = differenceInDays(expiryDate, now)

    if (daysUntilExpiry < 0) return "expired"
    if (daysUntilExpiry <= 30) return "expiring"
    return "valid"
  }, [])

  const calculateStats = useCallback((certs: Certification[]) => {
    const computed: CertificationStats = {
      valid: 0,
      expiringSoon: 0,
      expired: 0,
      revoked: 0,
    }

    certs.forEach((cert) => {
      const status = getCertStatus(cert)
      switch (status) {
        case "valid":
          computed.valid += 1
          break
        case "expiring":
          computed.expiringSoon += 1
          break
        case "expired":
          computed.expired += 1
          break
        case "revoked":
          computed.revoked += 1
          break
        default:
          break
      }
    })

    setStats(computed)
  }, [getCertStatus])

  const loadCertifications = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/progress/certifications")
      const data = await response.json() as { certifications?: Certification[]; error?: string }
      
      if (!response.ok) {
        throw new Error(data.error || "Error al cargar certificaciones")
      }

      const payload = data.certifications || []
      setCertifications(payload)
      calculateStats(payload)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al cargar certificaciones"
      console.error("Error cargando certificaciones:", error)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [calculateStats])

  useEffect(() => {
    loadCertifications()
  }, [loadCertifications])

  const filteredCertifications = useMemo(
    () =>
      certifications.filter((cert) => {
        const term = searchTerm.toLowerCase()
        const matchesSearch =
          cert.collaborator.firstName.toLowerCase().includes(term) ||
          cert.collaborator.lastName.toLowerCase().includes(term) ||
          cert.collaborator.email.toLowerCase().includes(term) ||
          cert.course.name.toLowerCase().includes(term) ||
          cert.course.code.toLowerCase().includes(term)

        const certStatus = getCertStatus(cert)
        const matchesStatus = statusFilter === "all" || certStatus === statusFilter

        return matchesSearch && matchesStatus
      }),
    [certifications, getCertStatus, searchTerm, statusFilter],
  )

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
    const rows = filteredCertifications.map((certification) => {
      const status = getCertStatus(certification)
      const config = certificationStatusConfig[status]
      const daysRemaining = certification.expiresAt
        ? differenceInDays(new Date(certification.expiresAt), new Date())
        : "N/A"

      return [
        `${certification.collaborator.firstName} ${certification.collaborator.lastName}`,
        certification.collaborator.email,
        certification.course.name,
        certification.course.code,
        config.label,
        format(new Date(certification.issuedAt), "dd/MM/yyyy", { locale: es }),
        certification.expiresAt
          ? format(new Date(certification.expiresAt), "dd/MM/yyyy", { locale: es })
          : "Sin vencimiento",
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
          <h2 className="text-2xl font-semibold tracking-tight">Ciclo de Vida</h2>
          <p className="text-muted-foreground mt-1">
            Administra vigencias, recertificaciones y revocaciones
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

      <CertificationStatsCards stats={stats} />

      <CertificationsTable
        certifications={certifications}
        filteredCertifications={filteredCertifications}
        loading={loading}
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        getCertificationStatus={getCertStatus}
        onRequestRecertify={(certification) => {
          setSelectedCert(certification)
          setRecertifyDialogOpen(true)
        }}
        onRequestRevoke={(certification) => {
          setSelectedCert(certification)
          setRevokeDialogOpen(true)
        }}
      />

      <RevokeCertificationDialog
        open={revokeDialogOpen}
        onOpenChange={(open) => {
          setRevokeDialogOpen(open)
          if (!open) {
            setSelectedCert(null)
            setRevocationReason("")
          }
        }}
        certification={selectedCert}
        reason={revocationReason}
        onReasonChange={setRevocationReason}
        onConfirm={handleRevoke}
        processing={processing}
      />

      <RecertifyCertificationDialog
        open={recertifyDialogOpen}
        onOpenChange={(open) => {
          setRecertifyDialogOpen(open)
          if (!open) {
            setSelectedCert(null)
          }
        }}
        certification={selectedCert}
        onConfirm={handleRecertify}
        processing={processing}
      />
    </div>
  )
}
