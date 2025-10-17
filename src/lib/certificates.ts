import { prisma } from './prisma'
import QRCode from 'qrcode'
import { randomBytes } from 'crypto'

/**
 * K1 - Datos del certificado para generación de PDF
 */
export interface CertificateData {
  id: string
  certificateNumber: string
  verificationCode: string
  collaboratorName: string
  collaboratorDni: string
  courseName: string
  courseHours: number
  score: number
  issuedAt: Date
  expiresAt: Date | null
  qrCodeDataUrl: string
}

/**
 * K2 - Datos públicos del certificado (para verificación)
 */
export interface PublicCertificateData {
  certificateNumber: string
  collaboratorName: string
  courseName: string
  issuedAt: Date
  expiresAt: Date | null
  isValid: boolean
  courseHours: number
  score: number
}

/**
 * Generar un código de verificación único
 */
export function generateVerificationCode(): string {
  const bytes = randomBytes(8)
  return bytes.toString('hex').toUpperCase()
}

/**
 * Generar QR code como Data URL
 */
export async function generateQRCode(data: string): Promise<string> {
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(data, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    })
    return qrCodeDataUrl
  } catch (error) {
    console.error('Error generating QR code:', error)
    throw new Error('No se pudo generar el código QR')
  }
}

/**
 * K1 - Obtener datos del certificado para generación de PDF
 */
export async function getCertificateData(
  certificationId: string
): Promise<CertificateData> {
  const certification = await prisma.certificationRecord.findUnique({
    where: { id: certificationId },
    include: {
      collaborator: true,
      course: true,
      courseProgress: true,
    },
  })

  if (!certification) {
    throw new Error('Certificado no encontrado')
  }

  // Generar código de verificación si no existe
  let verificationCode = certification.verificationCode
  if (!verificationCode) {
    verificationCode = generateVerificationCode()
    await prisma.certificationRecord.update({
      where: { id: certificationId },
      data: { verificationCode },
    })
  }

  // Generar URL de verificación
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/verify/${verificationCode}`

  // Generar QR code
  const qrCodeDataUrl = await generateQRCode(verificationUrl)

  // Guardar QR code en la base de datos
  await prisma.certificationRecord.update({
    where: { id: certificationId },
    data: { qrCode: qrCodeDataUrl },
  })

  // Calcular horas del curso
  const courseHours = certification.course.duration || 0

  // Obtener nota (calculada del progreso)
  const score = certification.courseProgress.progressPercent || 0

  return {
    id: certification.id,
    certificateNumber: certification.certificateNumber,
    verificationCode,
    collaboratorName: certification.collaborator.fullName,
    collaboratorDni: certification.collaborator.dni,
    courseName: certification.course.name,
    courseHours,
    score,
    issuedAt: certification.issuedAt,
    expiresAt: certification.expiresAt,
    qrCodeDataUrl,
  }
}

/**
 * K2 - Verificar un certificado por código
 */
export async function verifyCertificate(
  code: string
): Promise<PublicCertificateData | null> {
  const certification = await prisma.certificationRecord.findUnique({
    where: { verificationCode: code },
    include: {
      collaborator: true,
      course: true,
      courseProgress: true,
    },
  })

  if (!certification) {
    return null
  }

  const courseHours = certification.course.duration || 0
  const score = certification.courseProgress.progressPercent || 0

  return {
    certificateNumber: certification.certificateNumber,
    collaboratorName: certification.collaborator.fullName,
    courseName: certification.course.name,
    issuedAt: certification.issuedAt,
    expiresAt: certification.expiresAt,
    isValid: certification.isValid,
    courseHours,
    score,
  }
}

/**
 * K1 - Listar certificados con filtros
 */
export async function listCertificates(filters: {
  collaboratorId?: string
  courseId?: string
  isValid?: boolean
  hasVerificationCode?: boolean
  startDate?: string
  endDate?: string
}) {
  const certificates = await prisma.certificationRecord.findMany({
    where: {
      ...(filters.collaboratorId && {
        collaboratorId: filters.collaboratorId,
      }),
      ...(filters.courseId && { courseId: filters.courseId }),
      ...(filters.isValid !== undefined && { isValid: filters.isValid }),
      ...(filters.hasVerificationCode !== undefined &&
        (filters.hasVerificationCode
          ? { verificationCode: { not: null } }
          : { verificationCode: null })),
      ...(filters.startDate && {
        issuedAt: { gte: new Date(filters.startDate) },
      }),
      ...(filters.endDate && {
        issuedAt: { lte: new Date(filters.endDate) },
      }),
    },
    include: {
      collaborator: true,
      course: true,
      courseProgress: true,
    },
    orderBy: { issuedAt: 'desc' },
  })

  return certificates.map((cert) => ({
    id: cert.id,
    certificateNumber: cert.certificateNumber,
    collaboratorName: cert.collaborator.fullName,
    collaboratorDni: cert.collaborator.dni,
    courseName: cert.course.name,
    issuedAt: cert.issuedAt,
    expiresAt: cert.expiresAt,
    isValid: cert.isValid,
    verificationCode: cert.verificationCode,
    hasPdf: !!cert.pdfUrl,
  }))
}

/**
 * K1 - Actualizar URL del PDF generado
 */
export async function updateCertificatePdf(
  certificationId: string,
  pdfUrl: string,
  metadata: {
    size: number
    generatedAt: string
  }
) {
  return await prisma.certificationRecord.update({
    where: { id: certificationId },
    data: {
      pdfUrl,
      pdfMetadata: metadata,
    },
  })
}
