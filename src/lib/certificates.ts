import type { CertificationRecord, Prisma, ProgressStatus } from "@prisma/client"
import { randomBytes } from "crypto"
import QRCode from "qrcode"
import { createNotificationFromTemplate } from "@/lib/notifications"
import { prisma } from "./prisma"

type CertificationDbClient = Prisma.TransactionClient | typeof prisma

const CERTIFIABLE_PROGRESS_STATUSES = new Set<ProgressStatus>([
  "PASSED",
  "EXEMPTED",
])

const certificationInclude = {
  collaborator: {
    select: {
      id: true,
      fullName: true,
      email: true,
      dni: true,
      user: {
        select: {
          id: true,
        },
      },
    },
  },
  course: {
    select: {
      id: true,
      code: true,
      name: true,
      validity: true,
      currentVersion: true,
      duration: true,
    },
  },
  previousCert: {
    select: {
      id: true,
      certificateNumber: true,
      issuedAt: true,
    },
  },
  courseProgress: {
    select: {
      id: true,
      status: true,
      progressPercent: true,
      certifiedAt: true,
      enrollmentId: true,
    },
  },
} satisfies Prisma.CertificationRecordInclude

export type CertificationWithRelations = Prisma.CertificationRecordGetPayload<{
  include: typeof certificationInclude
}>

export type EffectiveCertificateStatus =
  | "VALID"
  | "EXPIRING"
  | "EXPIRED"
  | "REVOKED"

export interface EffectiveCertificateState {
  status: EffectiveCertificateStatus
  isValid: boolean
  isExpired: boolean
  isRevoked: boolean
  daysUntilExpiry: number | null
}

export interface CertificateData {
  id: string
  certificateNumber: string
  verificationCode: string
  collaboratorId: string
  collaboratorName: string
  collaboratorDni: string
  courseName: string
  courseHours: number
  score: number
  issuedAt: Date
  expiresAt: Date | null
  qrCodeDataUrl: string
}

export interface PublicCertificateData {
  certificateNumber: string
  collaboratorName: string
  courseName: string
  issuedAt: Date
  expiresAt: Date | null
  isValid: boolean
  effectiveStatus: EffectiveCertificateStatus
  courseHours: number
  score: number
}

interface EnsureCertificationOptions {
  certificateData?: Prisma.InputJsonValue | undefined
  expiresAt?: Date | null
  trigger?: string
}

interface EnsureCertificationResult {
  certification: CertificationWithRelations
  created: boolean
}

function splitFullName(fullName: string) {
  const parts = fullName.trim().split(/\s+/)
  return {
    firstName: parts[0] || "",
    lastName: parts.slice(1).join(" "),
  }
}

function calculateExpirationDate(validityMonths?: number | null) {
  if (!validityMonths) return null

  const expiresAt = new Date()
  expiresAt.setMonth(expiresAt.getMonth() + validityMonths)
  return expiresAt
}

function extractCertificateScore(
  certificateData: Prisma.JsonValue | null | undefined,
  fallbackScore: number
) {
  if (
    certificateData &&
    typeof certificateData === "object" &&
    !Array.isArray(certificateData)
  ) {
    const rawScore = (certificateData as Record<string, unknown>).score
    if (typeof rawScore === "number") {
      return rawScore
    }
  }

  return fallbackScore
}

export function getEffectiveCertificateState(
  certification: Pick<CertificationRecord, "expiresAt" | "revokedAt" | "isValid">,
  now = new Date()
): EffectiveCertificateState {
  const hasExpired = Boolean(
    certification.expiresAt && certification.expiresAt.getTime() < now.getTime()
  )

  if (certification.revokedAt || certification.isValid === false) {
    return {
      status: "REVOKED",
      isValid: false,
      isExpired: hasExpired,
      isRevoked: true,
      daysUntilExpiry: certification.expiresAt
        ? Math.ceil(
            (certification.expiresAt.getTime() - now.getTime()) /
              (1000 * 60 * 60 * 24)
          )
        : null,
    }
  }

  if (hasExpired) {
    return {
      status: "EXPIRED",
      isValid: false,
      isExpired: true,
      isRevoked: false,
      daysUntilExpiry: Math.ceil(
        (certification.expiresAt!.getTime() - now.getTime()) /
          (1000 * 60 * 60 * 24)
      ),
    }
  }

  if (certification.expiresAt) {
    const daysUntilExpiry = Math.ceil(
      (certification.expiresAt.getTime() - now.getTime()) /
        (1000 * 60 * 60 * 24)
    )

    if (daysUntilExpiry <= 30) {
      return {
        status: "EXPIRING",
        isValid: true,
        isExpired: false,
        isRevoked: false,
        daysUntilExpiry,
      }
    }

    return {
      status: "VALID",
      isValid: true,
      isExpired: false,
      isRevoked: false,
      daysUntilExpiry,
    }
  }

  return {
    status: "VALID",
    isValid: true,
    isExpired: false,
    isRevoked: false,
    daysUntilExpiry: null,
  }
}

function buildCertificateValidityWhere(
  isValid: boolean | undefined,
  now: Date
): Prisma.CertificationRecordWhereInput {
  if (isValid === undefined) {
    return {}
  }

  if (isValid) {
    return {
      isValid: true,
      revokedAt: null,
      OR: [
        { expiresAt: null },
        { expiresAt: { gte: now } },
      ],
    }
  }

  return {
    OR: [
      { isValid: false },
      { revokedAt: { not: null } },
      { expiresAt: { lt: now } },
    ],
  }
}

async function generateUniqueVerificationCodeWithClient(
  client: CertificationDbClient
) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const verificationCode = generateVerificationCode()
    const existing = await client.certificationRecord.findUnique({
      where: { verificationCode },
      select: { id: true },
    })

    if (!existing) {
      return verificationCode
    }
  }

  throw new Error("No se pudo generar un codigo de verificacion unico")
}

async function generateUniqueCertificationIdentifiersWithClient(
  client: CertificationDbClient
) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const certificateNumber = generateCertificateNumber()
    const verificationCode =
      await generateUniqueVerificationCodeWithClient(client)

    const existing = await client.certificationRecord.findFirst({
      where: {
        OR: [{ certificateNumber }, { verificationCode }],
      },
      select: { id: true },
    })

    if (!existing) {
      return { certificateNumber, verificationCode }
    }
  }

  throw new Error(
    "No se pudieron generar identificadores unicos para el certificado"
  )
}

async function maybeLinkEnrollment(
  client: CertificationDbClient,
  progress: {
    id: string
    collaboratorId: string
    courseId: string
    enrollmentId: string | null
  }
) {
  if (progress.enrollmentId) {
    return progress.enrollmentId
  }

  const enrollment = await client.enrollment.findFirst({
    where: {
      collaboratorId: progress.collaboratorId,
      courseId: progress.courseId,
      status: { not: "CANCELLED" },
    },
    orderBy: { enrolledAt: "desc" },
    select: { id: true },
  })

  if (!enrollment) {
    return null
  }

  await client.courseProgress.update({
    where: { id: progress.id },
    data: { enrollmentId: enrollment.id },
  })

  return enrollment.id
}

async function notifyCertificateReady(
  certification: CertificationWithRelations,
  enrollmentId: string | null
) {
  const userId = certification.collaborator.user?.id
  if (!userId) {
    return
  }

  try {
    await createNotificationFromTemplate(
      userId,
      "CERTIFICATE_READY",
      {
        collaboratorName: certification.collaborator.fullName,
        courseName: certification.course.name,
        certificateNumber: certification.certificateNumber,
        expirationDate:
          certification.expiresAt?.toLocaleDateString("es-PE") ??
          "Sin vencimiento",
      },
      {
        collaboratorId: certification.collaboratorId,
        relatedCourseId: certification.courseId,
        relatedEnrollmentId: enrollmentId ?? undefined,
        relatedCertificationId: certification.id,
      }
    )
  } catch (error) {
    console.error(
      `No se pudo enviar la notificacion CERTIFICATE_READY para ${certification.id}:`,
      error
    )
  }
}

export function generateVerificationCode(): string {
  const bytes = randomBytes(8)
  return bytes.toString("hex").toUpperCase()
}

export function generateCertificateNumber(prefix = "CERT"): string {
  const year = new Date().getFullYear()
  const suffix = randomBytes(6).toString("hex").toUpperCase()
  return `${prefix}-${year}-${suffix}`
}

export async function generateUniqueVerificationCode() {
  return generateUniqueVerificationCodeWithClient(prisma)
}

export async function generateUniqueCertificationIdentifiers() {
  return generateUniqueCertificationIdentifiersWithClient(prisma)
}

export async function generateQRCode(data: string): Promise<string> {
  try {
    return await QRCode.toDataURL(data, {
      width: 300,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    })
  } catch (error) {
    console.error("Error generating QR code:", error)
    throw new Error("No se pudo generar el codigo QR")
  }
}

export async function getCertificationWithRelations(certificationId: string) {
  return prisma.certificationRecord.findUnique({
    where: { id: certificationId },
    include: certificationInclude,
  })
}

export function serializeCertification(
  certification: CertificationWithRelations
) {
  const { firstName, lastName } = splitFullName(
    certification.collaborator.fullName
  )
  const effectiveState = getEffectiveCertificateState(certification)

  return {
    id: certification.id,
    certificateNumber: certification.certificateNumber,
    verificationCode: certification.verificationCode,
    pdfUrl: certification.pdfUrl,
    isValid: effectiveState.isValid,
    effectiveStatus: effectiveState.status,
    daysUntilExpiry: effectiveState.daysUntilExpiry,
    isRecertification: certification.isRecertification,
    collaborator: {
      id: certification.collaborator.id,
      firstName,
      lastName,
      email: certification.collaborator.email,
    },
    course: {
      id: certification.course.id,
      name: certification.course.name,
      code: certification.course.code,
      validityMonths: certification.course.validity,
      version: certification.course.currentVersion,
    },
    issuedAt: certification.issuedAt,
    expiresAt: certification.expiresAt,
    revokedAt: certification.revokedAt,
    revokedBy: certification.revokedBy,
    revocationReason: certification.revocationReason,
    previousCert: certification.previousCert
      ? {
          id: certification.previousCert.id,
          certificateNumber: certification.previousCert.certificateNumber,
          issuedAt: certification.previousCert.issuedAt,
        }
      : null,
  }
}

export async function ensureCertificationForProgress(
  courseProgressId: string,
  options: EnsureCertificationOptions = {}
): Promise<EnsureCertificationResult> {
  const txResult = await prisma.$transaction(async (tx) => {
    const progress = await tx.courseProgress.findUnique({
      where: { id: courseProgressId },
      include: {
        collaborator: {
          select: {
            id: true,
            fullName: true,
            user: {
              select: {
                id: true,
              },
            },
          },
        },
        course: {
          select: {
            id: true,
            name: true,
            validity: true,
          },
        },
      },
    })

    if (!progress) {
      throw new Error("Progreso de curso no encontrado")
    }

    if (!CERTIFIABLE_PROGRESS_STATUSES.has(progress.status)) {
      throw new Error(
        "Solo se puede certificar progreso aprobado o exonerado"
      )
    }

    const existing = await tx.certificationRecord.findFirst({
      where: { courseProgressId },
      orderBy: { issuedAt: "desc" },
      select: { id: true, issuedAt: true },
    })

    const enrollmentId = await maybeLinkEnrollment(tx, progress)

    if (existing) {
      if (!progress.certifiedAt) {
        await tx.courseProgress.update({
          where: { id: courseProgressId },
          data: { certifiedAt: existing.issuedAt },
        })
      }

      return {
        certificationId: existing.id,
        created: false,
        enrollmentId,
      }
    }

    const { certificateNumber, verificationCode } =
      await generateUniqueCertificationIdentifiersWithClient(tx)

    const expiresAt =
      options.expiresAt === undefined
        ? calculateExpirationDate(progress.course.validity)
        : options.expiresAt

    const createdCertification = await tx.certificationRecord.create({
      data: {
        courseProgressId,
        collaboratorId: progress.collaboratorId,
        courseId: progress.courseId,
        certificateNumber,
        verificationCode,
        expiresAt,
        certificateData: options.certificateData,
      },
      select: { id: true },
    })

    await tx.courseProgress.update({
      where: { id: courseProgressId },
      data: {
        certifiedAt: new Date(),
        status: progress.status === "EXEMPTED" ? "EXEMPTED" : "PASSED",
      },
    })

    return {
      certificationId: createdCertification.id,
      created: true,
      enrollmentId,
    }
  })

  const certification = await getCertificationWithRelations(txResult.certificationId)
  if (!certification) {
    throw new Error("Certificado no encontrado")
  }

  if (txResult.created) {
    await notifyCertificateReady(certification, txResult.enrollmentId)
  }

  return {
    certification,
    created: txResult.created,
  }
}

export async function repairMissingCertifications() {
  const eligibleProgress = await prisma.courseProgress.findMany({
    where: {
      status: {
        in: ["PASSED", "EXEMPTED"],
      },
    },
    select: {
      id: true,
    },
  })

  let created = 0
  let skipped = 0
  let failed = 0
  const failures: Array<{ courseProgressId: string; error: string }> = []

  for (const progress of eligibleProgress) {
    try {
      const result = await ensureCertificationForProgress(progress.id, {
        trigger: "BACKFILL",
      })

      if (result.created) {
        created += 1
      } else {
        skipped += 1
      }
    } catch (error) {
      failed += 1
      failures.push({
        courseProgressId: progress.id,
        error:
          error instanceof Error
            ? error.message
            : "Error al reparar certificacion",
      })
    }
  }

  return {
    created,
    skipped,
    failed,
    failures,
  }
}

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
    throw new Error("Certificado no encontrado")
  }

  let verificationCode = certification.verificationCode
  if (!verificationCode) {
    verificationCode = await generateUniqueVerificationCode()
    await prisma.certificationRecord.update({
      where: { id: certificationId },
      data: { verificationCode },
    })
  }

  let qrCodeDataUrl = certification.qrCode
  if (!qrCodeDataUrl) {
    const verificationUrl = `${
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    }/verify/${verificationCode}`

    qrCodeDataUrl = await generateQRCode(verificationUrl)

    await prisma.certificationRecord.update({
      where: { id: certificationId },
      data: { qrCode: qrCodeDataUrl },
    })
  }

  const courseHours = certification.course.duration || 0
  const score = extractCertificateScore(
    certification.certificateData,
    certification.courseProgress.progressPercent || 0
  )

  return {
    id: certification.id,
    certificateNumber: certification.certificateNumber,
    verificationCode,
    collaboratorId: certification.collaboratorId,
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

  const effectiveState = getEffectiveCertificateState(certification)
  const courseHours = certification.course.duration || 0
  const score = extractCertificateScore(
    certification.certificateData,
    certification.courseProgress.progressPercent || 0
  )

  return {
    certificateNumber: certification.certificateNumber,
    collaboratorName: certification.collaborator.fullName,
    courseName: certification.course.name,
    issuedAt: certification.issuedAt,
    expiresAt: certification.expiresAt,
    isValid: effectiveState.isValid,
    effectiveStatus: effectiveState.status,
    courseHours,
    score,
  }
}

export async function listCertificates(filters: {
  collaboratorId?: string
  courseId?: string
  isValid?: boolean
  hasVerificationCode?: boolean
  startDate?: string
  endDate?: string
}) {
  const now = new Date()
  const certificates = await prisma.certificationRecord.findMany({
    where: {
      ...(filters.collaboratorId && {
        collaboratorId: filters.collaboratorId,
      }),
      ...(filters.courseId && { courseId: filters.courseId }),
      ...buildCertificateValidityWhere(filters.isValid, now),
      ...(filters.hasVerificationCode !== undefined &&
        (filters.hasVerificationCode
          ? { verificationCode: { not: null } }
          : { verificationCode: null })),
      ...((filters.startDate || filters.endDate) && {
        issuedAt: {
          ...(filters.startDate && { gte: new Date(filters.startDate) }),
          ...(filters.endDate && { lte: new Date(filters.endDate) }),
        },
      }),
    },
    include: {
      collaborator: true,
      course: true,
    },
    orderBy: { issuedAt: "desc" },
  })

  return certificates.map((cert) => {
    const effectiveState = getEffectiveCertificateState(cert)

    return {
      id: cert.id,
      certificateNumber: cert.certificateNumber,
      collaboratorName: cert.collaborator.fullName,
      collaboratorDni: cert.collaborator.dni,
      courseName: cert.course.name,
      issuedAt: cert.issuedAt,
      expiresAt: cert.expiresAt,
      isValid: effectiveState.isValid,
      effectiveStatus: effectiveState.status,
      daysUntilExpiry: effectiveState.daysUntilExpiry,
      verificationCode: cert.verificationCode,
      hasPdf: !!cert.pdfUrl,
      pdfUrl: cert.pdfUrl,
    }
  })
}

export async function updateCertificatePdf(
  certificationId: string,
  pdfUrl: string,
  metadata: {
    size: number
    generatedAt: string
    storageMode?: string
  }
) {
  return prisma.certificationRecord.update({
    where: { id: certificationId },
    data: {
      pdfUrl,
      pdfMetadata: metadata,
    },
  })
}

export async function persistCertificatePdfArtifact(
  certificationId: string,
  size: number
) {
  const pdfUrl = `/api/certificates/${certificationId}/download`

  await updateCertificatePdf(certificationId, pdfUrl, {
    size,
    generatedAt: new Date().toISOString(),
    storageMode: "ON_DEMAND_DOWNLOAD",
  })

  return pdfUrl
}
