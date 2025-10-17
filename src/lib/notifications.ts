import { prisma } from "@/lib/prisma"
import { NotificationType, NotificationChannel, NotificationPriority } from "@prisma/client"

/**
 * Servicio para gestión de notificaciones y recordatorios
 */

interface CreateNotificationParams {
  userId: string
  collaboratorId?: string
  type: NotificationType
  templateId?: string
  subject: string
  bodyHtml: string
  bodyText: string
  priority?: NotificationPriority
  channel?: NotificationChannel
  relatedCourseId?: string
  relatedEnrollmentId?: string
  relatedCertificationId?: string
  scheduledFor?: Date
}

/**
 * Crea una notificación individual
 */
export async function createNotification(params: CreateNotificationParams) {
  const notification = await prisma.notification.create({
    data: {
      userId: params.userId,
      collaboratorId: params.collaboratorId,
      type: params.type,
      templateId: params.templateId,
      subject: params.subject,
      bodyHtml: params.bodyHtml,
      bodyText: params.bodyText,
      priority: params.priority || "MEDIUM",
      channel: params.channel || "IN_APP",
      relatedCourseId: params.relatedCourseId,
      relatedEnrollmentId: params.relatedEnrollmentId,
      relatedCertificationId: params.relatedCertificationId,
      scheduledFor: params.scheduledFor,
      sentAt: params.scheduledFor ? undefined : new Date(),
    },
  })

  // Si debe enviarse por email y no está programada, enviar ahora
  if (
    (params.channel === "EMAIL" || params.channel === "BOTH") &&
    !params.scheduledFor
  ) {
    await sendEmailNotification(notification.id)
  }

  return notification
}

/**
 * Envía una notificación por email (simulado)
 */
async function sendEmailNotification(notificationId: string) {
  try {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
      include: {
        template: true,
      },
    })

    if (!notification) {
      throw new Error("Notificación no encontrada")
    }

    // TODO: Integrar con servicio de email real (Resend, SendGrid, etc.)
    // Por ahora, solo marcamos como enviado
    console.log(`Enviando email: ${notification.subject} a usuario ${notification.userId}`)

    await prisma.notification.update({
      where: { id: notificationId },
      data: {
        emailSent: true,
        emailSentAt: new Date(),
      },
    })

    return true
  } catch (error) {
    console.error(`Error enviando email para notificación ${notificationId}:`, error)

    await prisma.notification.update({
      where: { id: notificationId },
      data: {
        emailSent: false,
        emailError: error instanceof Error ? error.message : "Error desconocido",
      },
    })

    return false
  }
}

/**
 * Reemplaza variables en una plantilla
 */
function replaceTemplateVariables(
  template: string,
  variables: Record<string, string>
): string {
  let result = template
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`{{${key}}}`, "g"), value)
  }
  return result
}

/**
 * Crea notificación desde plantilla
 */
export async function createNotificationFromTemplate(
  userId: string,
  type: NotificationType,
  variables: Record<string, string>,
  options?: {
    collaboratorId?: string
    relatedCourseId?: string
    relatedEnrollmentId?: string
    relatedCertificationId?: string
    scheduledFor?: Date
  }
) {
  // Obtener plantilla
  const template = await prisma.notificationTemplate.findUnique({
    where: { type },
  })

  if (!template || !template.isActive) {
    throw new Error(`Plantilla no encontrada o inactiva para tipo: ${type}`)
  }

  // Verificar preferencias del usuario
  const preference = await prisma.notificationPreference.findUnique({
    where: {
      userId_type: {
        userId,
        type,
      },
    },
  })

  // Determinar canal según preferencias
  let channel = template.defaultChannel

  if (preference) {
    if (!preference.enableEmail && !preference.enableInApp) {
      // Usuario deshabilitó ambos canales, no enviar
      return null
    }

    if (!preference.enableEmail && preference.enableInApp) {
      channel = "IN_APP"
    } else if (preference.enableEmail && !preference.enableInApp) {
      channel = "EMAIL"
    }
  }

  // Reemplazar variables en plantilla
  const subject = replaceTemplateVariables(template.subject, variables)
  const bodyHtml = replaceTemplateVariables(template.bodyHtml, variables)
  const bodyText = replaceTemplateVariables(template.bodyText, variables)

  // Crear notificación
  return createNotification({
    userId,
    collaboratorId: options?.collaboratorId,
    type,
    templateId: template.id,
    subject,
    bodyHtml,
    bodyText,
    priority: template.priority,
    channel,
    relatedCourseId: options?.relatedCourseId,
    relatedEnrollmentId: options?.relatedEnrollmentId,
    relatedCertificationId: options?.relatedCertificationId,
    scheduledFor: options?.scheduledFor,
  })
}

/**
 * Genera recordatorios de vencimiento
 */
export async function generateExpirationReminders(daysBeforeExpiration: number) {
  const targetDate = new Date()
  targetDate.setDate(targetDate.getDate() + daysBeforeExpiration)

  // Determinar tipo de notificación según días
  let notificationType: NotificationType
  if (daysBeforeExpiration === 30) {
    notificationType = "REMINDER_30_DAYS"
  } else if (daysBeforeExpiration === 7) {
    notificationType = "REMINDER_7_DAYS"
  } else if (daysBeforeExpiration === 1) {
    notificationType = "REMINDER_1_DAY"
  } else {
    throw new Error("Días de anticipación no soportados")
  }

  // Buscar cursos próximos a vencer
  const progressRecords = await prisma.courseProgress.findMany({
    where: {
      expiresAt: {
        gte: new Date(targetDate.setHours(0, 0, 0, 0)),
        lte: new Date(targetDate.setHours(23, 59, 59, 999)),
      },
      status: {
        in: ["IN_PROGRESS", "NOT_STARTED"],
      },
    },
    include: {
      collaborator: {
        include: {
          user: true,
        },
      },
      course: true,
    },
  })

  let successCount = 0
  let failureCount = 0

  // Crear notificaciones
  for (const progress of progressRecords) {
    if (!progress.collaborator.user) continue

    try {
      await createNotificationFromTemplate(
        progress.collaborator.user.id,
        notificationType,
        {
          collaboratorName: progress.collaborator.fullName,
          courseName: progress.course.name,
          courseCode: progress.course.code,
          dueDate: progress.expiresAt?.toLocaleDateString() || "",
          daysRemaining: daysBeforeExpiration.toString(),
        },
        {
          collaboratorId: progress.collaboratorId,
          relatedCourseId: progress.courseId,
        }
      )
      successCount++
    } catch (error) {
      console.error(`Error creando notificación para ${progress.collaboratorId}:`, error)
      failureCount++
    }
  }

  // Registrar en log
  await prisma.notificationLog.create({
    data: {
      type: notificationType,
      channel: "BOTH",
      recipientCount: progressRecords.length,
      successCount,
      failureCount,
      subject: `Recordatorios de vencimiento (${daysBeforeExpiration} días)`,
      metadata: {
        daysBeforeExpiration,
        targetDate: targetDate.toISOString(),
      },
    },
  })

  return {
    totalRecords: progressRecords.length,
    successCount,
    failureCount,
  }
}

/**
 * Genera resumen semanal para jefes de área
 */
export async function generateTeamSummary(options?: {
  areaId?: string
  siteId?: string
}) {
  // Buscar jefes de área
  const areaHeads = await prisma.areaHeadHistory.findMany({
    where: {
      endDate: null, // Solo jefes actuales
      ...(options?.areaId && { areaId: options.areaId }),
    },
    include: {
      collaborator: {
        include: {
          user: true,
        },
      },
      area: {
        include: {
          collaborators: {
            where: {
              status: "ACTIVE",
              ...(options?.siteId && { siteId: options.siteId }),
            },
            include: {
              courseProgress: {
                where: {
                  status: {
                    in: ["IN_PROGRESS", "NOT_STARTED"],
                  },
                },
                include: {
                  course: true,
                },
              },
            },
          },
        },
      },
    },
  })

  let successCount = 0
  let failureCount = 0

  for (const areaHead of areaHeads) {
    if (!areaHead.collaborator.user) continue

    // Calcular estadísticas del equipo
    const teamMembers = areaHead.area.collaborators
    const totalPendingCourses = teamMembers.reduce(
      (sum, member) => sum + member.courseProgress.length,
      0
    )

    // Cursos próximos a vencer (próximos 7 días)
    const upcomingDeadline = new Date()
    upcomingDeadline.setDate(upcomingDeadline.getDate() + 7)

    const upcomingCourses = teamMembers.flatMap((member) =>
      member.courseProgress.filter(
        (progress) =>
          progress.expiresAt &&
          progress.expiresAt <= upcomingDeadline &&
          progress.expiresAt >= new Date()
      )
    )

    // Crear contenido del resumen
    const bodyHtml = `
      <h2>Resumen Semanal - Área: ${areaHead.area.name}</h2>
      <p>Estimado/a ${areaHead.collaborator.fullName},</p>
      <p>Este es el resumen de capacitaciones pendientes de su equipo:</p>
      
      <h3>Estadísticas Generales</h3>
      <ul>
        <li><strong>Total de colaboradores:</strong> ${teamMembers.length}</li>
        <li><strong>Cursos pendientes totales:</strong> ${totalPendingCourses}</li>
        <li><strong>Cursos próximos a vencer (7 días):</strong> ${upcomingCourses.length}</li>
      </ul>
      
      ${
        upcomingCourses.length > 0
          ? `
        <h3>Cursos Próximos a Vencer</h3>
        <ul>
          ${upcomingCourses
            .map(
              (progress) =>
                `<li>${progress.course.name} - Vence: ${progress.expiresAt?.toLocaleDateString()}</li>`
            )
            .join("")}
        </ul>
      `
          : ""
      }
      
      <p>Le recomendamos hacer seguimiento con los colaboradores para asegurar el cumplimiento.</p>
    `

    const bodyText = `
Resumen Semanal - Área: ${areaHead.area.name}

Estimado/a ${areaHead.collaborator.fullName},

Este es el resumen de capacitaciones pendientes de su equipo:

Estadísticas Generales:
- Total de colaboradores: ${teamMembers.length}
- Cursos pendientes totales: ${totalPendingCourses}
- Cursos próximos a vencer (7 días): ${upcomingCourses.length}

${
  upcomingCourses.length > 0
    ? `
Cursos Próximos a Vencer:
${upcomingCourses
  .map(
    (progress) =>
      `- ${progress.course.name} - Vence: ${progress.expiresAt?.toLocaleDateString()}`
  )
  .join("\n")}
`
    : ""
}

Le recomendamos hacer seguimiento con los colaboradores para asegurar el cumplimiento.
    `

    try {
      await createNotification({
        userId: areaHead.collaborator.user.id,
        collaboratorId: areaHead.collaboratorId,
        type: "TEAM_SUMMARY",
        subject: `Resumen Semanal - ${areaHead.area.name}`,
        bodyHtml,
        bodyText,
        priority: "MEDIUM",
        channel: "BOTH",
      })
      successCount++
    } catch (error) {
      console.error(
        `Error creando resumen para jefe ${areaHead.collaboratorId}:`,
        error
      )
      failureCount++
    }
  }

  // Registrar en log
  await prisma.notificationLog.create({
    data: {
      type: "TEAM_SUMMARY",
      channel: "BOTH",
      recipientCount: areaHeads.length,
      successCount,
      failureCount,
      subject: "Resumen semanal para jefes de área",
      metadata: {
        areaId: options?.areaId,
        siteId: options?.siteId,
      },
    },
  })

  return {
    totalRecipients: areaHeads.length,
    successCount,
    failureCount,
  }
}

/**
 * Marca notificación como leída
 */
export async function markNotificationAsRead(notificationId: string) {
  return prisma.notification.update({
    where: { id: notificationId },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  })
}

/**
 * Marca todas las notificaciones de un usuario como leídas
 */
export async function markAllNotificationsAsRead(userId: string) {
  return prisma.notification.updateMany({
    where: {
      userId,
      isRead: false,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  })
}

/**
 * Archiva una notificación
 */
export async function archiveNotification(notificationId: string) {
  return prisma.notification.update({
    where: { id: notificationId },
    data: {
      isArchived: true,
      archivedAt: new Date(),
    },
  })
}

/**
 * Obtiene notificaciones no leídas de un usuario
 */
export async function getUnreadNotifications(userId: string) {
  return prisma.notification.findMany({
    where: {
      userId,
      isRead: false,
      isArchived: false,
    },
    include: {
      template: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  })
}

/**
 * Cuenta notificaciones no leídas de un usuario
 */
export async function countUnreadNotifications(userId: string) {
  return prisma.notification.count({
    where: {
      userId,
      isRead: false,
      isArchived: false,
    },
  })
}
