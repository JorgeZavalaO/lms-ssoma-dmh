'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { CertificateStatsCards } from '@/components/admin/certificates/certificate-stats-cards'
import { CertificatesTable } from '@/components/admin/certificates/certificates-table'
import type { Certificate, CertificateStats, CertificateValidityFilter } from '@/components/admin/certificates/types'

export function ClientCertificates() {
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [stats, setStats] = useState<CertificateStats>({ total: 0, valid: 0, invalid: 0, expiring: 0 })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [validFilter, setValidFilter] = useState<CertificateValidityFilter>('all')
  const [processing, setProcessing] = useState(false)

  const calculateStats = useCallback((certs: Certificate[]) => {
    const now = new Date()
    const computed: CertificateStats = {
      total: certs.length,
      valid: certs.filter((certificate) => certificate.isValid).length,
      invalid: certs.filter((certificate) => !certificate.isValid).length,
      expiring: certs.filter((certificate) => {
        if (!certificate.expiresAt) return false
        const expiresAt = new Date(certificate.expiresAt)
        const daysUntilExpiry = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        return daysUntilExpiry <= 30 && daysUntilExpiry > 0 && certificate.isValid
      }).length,
    }

    setStats(computed)
  }, [])

  const loadCertificates = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      
      if (validFilter !== 'all') {
        params.append('isValid', validFilter === 'valid' ? 'true' : 'false')
      }

      const response = await fetch(`/api/certificates?${params.toString()}`)
      const data = await response.json() as { certificates?: Certificate[]; error?: string }

      if (!response.ok) {
        throw new Error(data.error || 'Error al cargar certificados')
      }

      setCertificates(data.certificates || [])
      calculateStats(data.certificates || [])
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al cargar certificados'
      console.error('Error cargando certificados:', error)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [calculateStats, validFilter])

  useEffect(() => {
    loadCertificates()
  }, [loadCertificates])

  const filteredCertificates = useMemo(
    () =>
      certificates.filter((certificate) => {
        const term = searchTerm.toLowerCase()
        return (
          certificate.certificateNumber.toLowerCase().includes(term) ||
          certificate.collaboratorName.toLowerCase().includes(term) ||
          certificate.collaboratorDni.toLowerCase().includes(term) ||
          certificate.courseName.toLowerCase().includes(term)
        )
      }),
    [certificates, searchTerm],
  )

  const handleGenerate = async (certId: string) => {
    try {
      setProcessing(true)
      const response = await fetch('/api/certificates/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ certificationId: certId }),
      })

      const data = await response.json() as { verificationCode?: string; error?: string }

      if (!response.ok) {
        throw new Error(data.error || 'Error al generar certificado')
      }

      toast.success(`Certificado generado. Código: ${data.verificationCode}`)
      loadCertificates()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al generar certificado'
      console.error('Error generando certificado:', error)
      toast.error(message)
    } finally {
      setProcessing(false)
    }
  }

  const handleDownload = (certId: string) => {
    try {
      window.open(`/api/certificates/${certId}/download`, '_blank')
      toast.success('Descargando certificado...')
    } catch (error) {
      console.error('Error al descargar certificado:', error)
      toast.error('Error al descargar certificado')
    }
  }

  const handleVerify = (code: string) => {
    window.open(`/verify/${code}`, '_blank')
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Certificados PDF</h2>
          <p className="text-muted-foreground mt-1">
            Genera, descarga y verifica certificados físicos
          </p>
        </div>
        <Button onClick={loadCertificates} variant="outline" disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Actualizar
        </Button>
      </div>

      <CertificateStatsCards stats={stats} />

      <CertificatesTable
        certificates={certificates}
        filteredCertificates={filteredCertificates}
        loading={loading}
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        validFilter={validFilter}
        onValidFilterChange={setValidFilter}
        onGenerate={handleGenerate}
        onDownload={handleDownload}
        onVerify={handleVerify}
        processing={processing}
      />
    </div>
  )
}
