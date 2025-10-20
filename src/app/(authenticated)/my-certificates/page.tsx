import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { ClientCertificatesView } from "./client-certificates-view"

export default async function MyCertificatesPage() {
  const session = await auth()

  if (!session?.user || !session.user.collaboratorId) {
    redirect("/login")
  }

  // Obtener todos los certificados del colaborador
  const certificates = await prisma.certificationRecord.findMany({
    where: {
      collaboratorId: session.user.collaboratorId,
    },
    include: {
      course: {
        select: {
          id: true,
          name: true,
          code: true,
          currentVersion: true,
        },
      },
    },
    orderBy: {
      issuedAt: "desc",
    },
  })

  // Serializar datos para pasarlos al cliente
  const serializedCertificates = certificates.map((cert) => ({
    id: cert.id,
    courseId: cert.courseId,
    courseName: cert.course.name,
    courseCode: cert.course.code,
    courseVersion: cert.course.currentVersion,
    certificateNumber: cert.certificateNumber,
    issuedAt: cert.issuedAt.toISOString(),
    expiresAt: cert.expiresAt?.toISOString() || null,
    isValid: cert.isValid,
    revokedAt: cert.revokedAt?.toISOString() || null,
    revocationReason: cert.revocationReason,
    pdfUrl: cert.pdfUrl,
    verificationCode: cert.verificationCode,
    qrCode: cert.qrCode,
    isRecertification: cert.isRecertification,
    recertificationDueAt: cert.recertificationDueAt?.toISOString() || null,
  }))

  return (
    <ClientCertificatesView
      certificates={serializedCertificates}
      collaboratorId={session.user.collaboratorId}
    />
  )
}
