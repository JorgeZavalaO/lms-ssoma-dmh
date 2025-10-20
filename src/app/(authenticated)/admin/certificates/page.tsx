'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Download, Eye, FileText, CheckCircle, XCircle } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

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

export default function AdminCertificatesPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadCertificates()
  }, [])

  const loadCertificates = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/certificates')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al cargar certificados')
      }

      setCertificates(data.certificates)
    } catch (err: any) {
      console.error('Error cargando certificados:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerate = async (certId: string) => {
    try {
      const response = await fetch('/api/certificates/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ certificationId: certId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al generar certificado')
      }

      alert(`Certificado generado. Código: ${data.verificationCode}`)
      loadCertificates()
    } catch (err: any) {
      console.error('Error generando certificado:', err)
      alert(err.message)
    }
  }

  const handleDownload = (certId: string) => {
    window.open(`/api/certificates/${certId}/download`, '_blank')
  }

  const handleVerify = (code: string) => {
    window.open(`/verify/${code}`, '_blank')
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Cargando certificados...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Gestión de Certificados
          </CardTitle>
          <CardDescription>
            Administra y descarga certificados emitidos (Módulo K)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
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
                {certificates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                      No hay certificados emitidos
                    </TableCell>
                  </TableRow>
                ) : (
                  certificates.map((cert) => (
                    <TableRow key={cert.id}>
                      <TableCell className="font-mono text-sm">
                        {cert.certificateNumber}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{cert.collaboratorName}</p>
                          <p className="text-sm text-gray-500">DNI: {cert.collaboratorDni}</p>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {cert.courseName}
                      </TableCell>
                      <TableCell>
                        {format(new Date(cert.issuedAt), 'dd/MM/yyyy', { locale: es })}
                      </TableCell>
                      <TableCell>
                        <Badge variant={cert.isValid ? 'default' : 'destructive'}>
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
                      <TableCell className="text-right space-x-2">
                        {!cert.verificationCode && (
                          <Button
                            size="sm"
                            onClick={() => handleGenerate(cert.id)}
                            variant="outline"
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            Generar
                          </Button>
                        )}
                        {cert.verificationCode && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleDownload(cert.id)}
                              variant="outline"
                            >
                              <Download className="h-4 w-4 mr-1" />
                              PDF
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleVerify(cert.verificationCode!)}
                              variant="outline"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Verificar
                            </Button>
                          </>
                        )}
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
