'use client'

import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, XCircle, Calendar, User, BookOpen, Award, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface CertificateInfo {
  certificateNumber: string
  collaboratorName: string
  courseName: string
  issuedAt: string
  expiresAt: string | null
  courseHours: number
  score: number
  isValid: boolean
}

export default function VerifyCertificatePage() {
  const params = useParams()
  const code = params?.code as string

  const [certificate, setCertificate] = useState<CertificateInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!code) return

    const verifyCertificate = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/certificates/verify/${code}`)
        const data = await response.json()

        if (!response.ok) {
          setError(data.error || 'Certificado no encontrado')
          setCertificate(null)
        } else {
          setCertificate(data.certificate)
          setError('')
        }
      } catch (err) {
        console.error('Error verificando certificado:', err)
        setError('Error al verificar el certificado')
        setCertificate(null)
      } finally {
        setLoading(false)
      }
    }

    verifyCertificate()
  }, [code])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Verificando certificado...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !certificate) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl border-red-200">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <XCircle className="h-16 w-16 text-red-500" />
            </div>
            <CardTitle className="text-2xl text-red-700">Certificado No Válido</CardTitle>
            <CardDescription className="text-red-600">
              {error || 'No se pudo verificar el certificado con el código proporcionado'}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              Código de verificación: <code className="bg-gray-100 px-2 py-1 rounded">{code}</code>
            </p>
            <p className="text-sm text-gray-500">
              Si cree que esto es un error, contacte al emisor del certificado.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isExpired = certificate.expiresAt && new Date(certificate.expiresAt) < new Date()
  const isActuallyValid = certificate.isValid && !isExpired

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-sm border-slate-200">
        <CardHeader className="text-center pb-6 border-b border-slate-200">
          <div className="mx-auto mb-4">
            {isActuallyValid ? (
              <CheckCircle2 className="h-16 w-16 text-emerald-600" />
            ) : (
              <XCircle className="h-16 w-16 text-red-600" />
            )}
          </div>
          <CardTitle className="text-2xl font-semibold mb-2">
            {isActuallyValid ? 'Certificado Válido' : 'Certificado No Válido'}
          </CardTitle>
          <CardDescription>
            Sistema de Gestión de Capacitación - DMH Construcciones y Servicios
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          {/* Estado */}
          <div className="flex justify-center">
            <Badge
              className={`text-base px-6 py-2 ${
                isActuallyValid 
                  ? 'bg-emerald-100 text-emerald-900' 
                  : 'bg-red-100 text-red-900'
              }`}
              variant="outline"
            >
              {isActuallyValid ? '✓ VÁLIDO' : '✗ NO VÁLIDO'}
            </Badge>
          </div>

          {/* Información del certificado */}
          <div className="bg-slate-50 rounded-lg p-6 space-y-4 border border-slate-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Número de certificado */}
              <div className="col-span-1 md:col-span-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Award className="h-4 w-4" />
                  <span className="font-medium">Número de Certificado</span>
                </div>
                <p className="text-lg font-semibold">
                  {certificate.certificateNumber}
                </p>
              </div>

              {/* Colaborador */}
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <User className="h-4 w-4" />
                  <span className="font-medium">Colaborador</span>
                </div>
                <p className="text-base font-medium">
                  {certificate.collaboratorName}
                </p>
              </div>

              {/* Curso */}
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <BookOpen className="h-4 w-4" />
                  <span className="font-medium">Curso</span>
                </div>
                <p className="text-base font-medium">
                  {certificate.courseName}
                </p>
              </div>

              {/* Fecha de emisión */}
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Calendar className="h-4 w-4" />
                  <span className="font-medium">Fecha de Emisión</span>
                </div>
                <p className="text-base">
                  {format(new Date(certificate.issuedAt), "dd 'de' MMMM 'de' yyyy", { locale: es })}
                </p>
              </div>

              {/* Vigencia */}
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Calendar className="h-4 w-4" />
                  <span className="font-medium">Vigencia</span>
                </div>
                <p className="text-base">
                  {certificate.expiresAt ? (
                    <>
                      {format(new Date(certificate.expiresAt), "dd 'de' MMMM 'de' yyyy", { locale: es })}
                      {isExpired && (
                        <Badge variant="destructive" className="ml-2 text-xs">Expirado</Badge>
                      )}
                    </>
                  ) : (
                    <span className="text-emerald-600 font-medium">Sin vencimiento</span>
                  )}
                </p>
              </div>

              {/* Horas */}
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Clock className="h-4 w-4" />
                  <span className="font-medium">Duración</span>
                </div>
                <p className="text-base font-medium">
                  {certificate.courseHours} horas
                </p>
              </div>

              {/* Calificación */}
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Award className="h-4 w-4" />
                  <span className="font-medium">Calificación</span>
                </div>
                <p className="text-base font-medium">
                  {certificate.score.toFixed(0)}%
                </p>
              </div>
            </div>
          </div>

          {/* Código de verificación */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900 text-center">
              <span className="font-medium">Código de Verificación:</span>{' '}
              <code className="bg-blue-100 px-3 py-1 rounded font-mono">
                {code}
              </code>
            </p>
          </div>

          {/* Pie de página */}
          <div className="text-center pt-4 border-t border-slate-200">
            <p className="text-xs text-muted-foreground">
              Este certificado ha sido verificado electrónicamente a través del sistema de DMH Construcciones y Servicios.
              <br />
              Para mayor información, contacte al departamento de SSOMA.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
