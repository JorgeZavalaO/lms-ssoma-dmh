'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Download, Eye, FileText, CheckCircle, XCircle, Search, RefreshCw } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { toast } from 'sonner'

interface Certificate {
  id: string
  certificateNumber: string
  collaboratorName: string
  collaboratorDni: string
  courseName: string
  issuedAt: string
  expiresAt: string | null
  isValid: boolean
  verificationCode: string | null
  hasPdf: boolean
}

interface CertificateStats {
  total: number
  valid: number
  invalid: number
  expiring: number
}

export function ClientCertificates() {
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [stats, setStats] = useState<CertificateStats>({ total: 0, valid: 0, invalid: 0, expiring: 0 })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [validFilter, setValidFilter] = useState<string>('all')
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    loadCertificates()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadCertificates = async () => {
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
  }

  const calculateStats = (certs: Certificate[]) => {
    const now = new Date()
    const stats: CertificateStats = {
      total: certs.length,
      valid: certs.filter(c => c.isValid).length,
      invalid: certs.filter(c => !c.isValid).length,
      expiring: certs.filter(c => {
        if (!c.expiresAt) return false
        const expiresAt = new Date(c.expiresAt)
        const daysUntilExpiry = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        return daysUntilExpiry <= 30 && daysUntilExpiry > 0 && c.isValid
      }).length,
    }
    setStats(stats)
  }

  const filteredCertificates = certificates.filter(cert => {
    const matchesSearch = 
      cert.certificateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.collaboratorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.collaboratorDni.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.courseName.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesSearch
  })

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
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Gestión de Certificados</h1>
        <p className="text-muted-foreground mt-2">
          Administra y descarga certificados emitidos (Módulo K)
        </p>
      </div>

      <div className="flex gap-2">
        <Button onClick={loadCertificates} variant="outline" disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Actualizar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">Certificados emitidos</p>
          </CardContent>
        </Card>

        <Card className="border-emerald-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Válidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-emerald-600">{stats.valid}</div>
            <p className="text-xs text-muted-foreground mt-1">En vigencia</p>
          </CardContent>
        </Card>

        <Card className="border-red-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Inválidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-red-600">{stats.invalid}</div>
            <p className="text-xs text-muted-foreground mt-1">Revocados o expirados</p>
          </CardContent>
        </Card>

        <Card className="border-amber-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Por Vencer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-amber-600">{stats.expiring}</div>
            <p className="text-xs text-muted-foreground mt-1">Próximos 30 días</p>
          </CardContent>
        </Card>
      </div>

      {/* Certificados Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Certificados</CardTitle>
          <CardDescription>
            Administra los certificados emitidos a colaboradores
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 mb-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por certificado, colaborador o curso..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <Select value={validFilter} onValueChange={setValidFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="valid">Válidos</SelectItem>
                  <SelectItem value="invalid">Inválidos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° Certificado</TableHead>
                  <TableHead>Colaborador</TableHead>
                  <TableHead>Curso</TableHead>
                  <TableHead>Emisión</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Cargando certificados...</p>
                    </TableCell>
                  </TableRow>
                ) : filteredCertificates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <FileText className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        {searchTerm || validFilter !== 'all'
                          ? 'No hay certificados con los filtros aplicados'
                          : 'No hay certificados emitidos'}
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCertificates.map((cert) => (
                    <TableRow key={cert.id}>
                      <TableCell className="font-mono text-sm">
                        {cert.certificateNumber}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{cert.collaboratorName}</p>
                          <p className="text-xs text-muted-foreground">DNI: {cert.collaboratorDni}</p>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {cert.courseName}
                      </TableCell>
                      <TableCell>
                        {format(new Date(cert.issuedAt), 'dd/MM/yyyy', { locale: es })}
                      </TableCell>
                      <TableCell>
                        <Badge variant={cert.isValid ? 'default' : 'destructive'} className={cert.isValid ? 'bg-emerald-600' : ''}>
                          {cert.isValid ? (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Válido
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3 w-3 mr-1" />
                              Inválido
                            </>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {!cert.verificationCode && (
                            <Button
                              size="sm"
                              onClick={() => handleGenerate(cert.id)}
                              variant="ghost"
                              disabled={processing}
                              title="Generar certificado"
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                          )}
                          {cert.verificationCode && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleDownload(cert.id)}
                                variant="ghost"
                                disabled={processing}
                                title="Descargar PDF"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleVerify(cert.verificationCode!)}
                                variant="ghost"
                                disabled={processing}
                                title="Verificar"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
