import { prisma } from "@/lib/prisma"
import {
  NotificationType,
  NotificationChannel,
  NotificationPriority,
} from "@prisma/client"
import { isEmailDeliveryEnabled } from "@/lib/operational-safety"

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

function resolveRequestedChannel(
  sendEmail: boolean,
  sendInApp: boolean
): NotificationChannel {
  if (sendEmail && sendInApp) return "BOTH"
  if (sendEmail) return "EMAIL"
  if (sendInApp) return "IN_APP"

  throw new Error("Debe habilitar al menos un canal de notificacion")
}

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
      sentAt:
        params.scheduledFor || params.channel === "EMAIL"
          ? undefined
          : new Date(),
    },
  })

  if (
    (params.channel === "EMAIL" || params.channel === "BOTH") &&
    !params.scheduledFor
  ) {
    await sendEmailNotification(notification.id)
  }

  return notification
}

async function sendEmailNotification(notificationId: string) {
  try {
    if (!isEmailDeliveryEnabled()) {
      await prisma.notification.update({
        where: { id: notificationId },
        data: {
          emailSent: false,
          emailError:
            "Canal EMAIL deshabilitado. Configure EMAIL_NOTIFICATIONS_ENABLED=true e integre un proveedor antes de habilitarlo.",
          sentAt: null,
        },
      })

      return false
    }

    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
      include: {
        template: true,
      },
    })

    if (!notification) {
      throw new Error("Notificacion no encontrada")
    }

    const provider = process.env.EMAIL_PROVIDER?.trim()
    if (!provider) {
      await prisma.notification.update({
        where: { id: notificationId },
        data: {
          emailSent: false,
          emailError:
            "No hay proveedor de email configurado. Defina EMAIL_PROVIDER y la integracion correspondiente.",
          sentAt: null,
        },
      })

      return false
    }

    throw new Error(
      `Proveedor de email no implementado: ${provider}. Integra el adaptador real antes de habilitar EMAIL_NOTIFICATIONS_ENABLED=true.`
    )
  } catch (error) {
    console.error(`Error enviando email para notificacion ${notificationId}:`, error)

    await prisma.notification.update({
      where: { id: notificationId },
      data: {
        emailSent: false,
        emailError: error instanceof Error ? error.message : "Error desconocido",
        sentAt: null,
      },
    })

    return false
  }
}

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
    channelOverride?: NotificationChannel
  }
) {
  const template = await prisma.notificationTemplate.findUnique({
    where: { type },
  })

  if (!template || !template.isActive) {
    throw new Error(`Plantilla no encontrada o inactiva para tipo: ${type}`)
  }

  const preference = await prisma.notificationPreference.findUnique({
    where: {
      userId_type: {
        userId,
        type,
      },
    },
  })

  let channel = options?.channelOverride || template.defaultChannel

  if (preference) {
    if (!preference.enableEmail && !preference.enableInApp) {
      return null
    }

    if (!preference.enableEmail && preference.enableInApp) {
      channel = "IN_APP"
    } else if (preference.enableEmail && !preference.enableInApp) {
      channel = "EMAIL"
    }
  }

  const subject = replaceTemplateVariables(template.subject, variables)
  const bodyHtml = replaceTemplateVariables(template.bodyHtml, variables)
  const bodyText = replaceTemplateVariables(template.bodyText, variables)

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

export async function generateExpirationReminders(options: {
  daysBeforeExpiration: number
  notificationType?: NotificationType
  sendEmail?: boolean
  sendInApp?: boolean
  sentBy?: string
}) {
  const daysBeforeExpiration = options.daysBeforeExpiration
  const channel = resolveRequestedChannel(
    options.sendEmail ?? true,
    options.sendInApp ?? true
  )
  const targetDate = new Date()
  targetDate.setDate(targetDate.getDate() + daysBeforeExpiration)

  let notificationType: NotificationType
  if (options.notificationType) {
    notificationType = options.notificationType
  } else if (daysBeforeExpiration === 30) {
    notificationType = "REMINDER_30_DAYS"
  } else if (daysBeforeExpiration === 7) {
    notificationType = "REMINDER_7_DAYS"
  } else if (daysBeforeExpiration === 1) {
    notificationType = "REMINDER_1_DAY"
  } else {
    throw new Error("Dias de anticipacion no soportados")
  }

  const dayStart = new Date(targetDate)
  dayStart.setHours(0, 0, 0, 0)
  const dayEnd = new Date(targetDate)
  dayEnd.setHours(23, 59, 59, 999)

  const progressRecords = await prisma.courseProgress.findMany({
    where: {
      expiresAt: {
        gte: dayStart,
        lte: dayEnd,
      },
      status: {
        in: ["PASSED", "EXEMPTED"],
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

  const eligibleRecipients = progressRecords.filter((progress) =>
    Boolean(progress.collaborator.user)
  )

  let successCount = 0
  let failureCount = 0

  for (const progress of eligibleRecipients) {
    if (!progress.collaborator.user) continue

    try {
      await createNotificationFromTemplate(
        progress.collaborator.user.id,
        notificationType,
        {
          collaboratorName: progress.collaborator.fullName,
          courseName: progress.course.name,
          courseCode: progress.course.code || "Sin codigo",
          expirationDate: progress.expiresAt?.toLocaleDateString() || "",
          dueDate: progress.expiresAt?.toLocaleDateString() || "",
          daysRemaining: daysBeforeExpiration.toString(),
        },
        {
          collaboratorId: progress.collaboratorId,
          relatedCourseId: progress.courseId,
          channelOverride: channel,
        }
      )
      successCount++
    } catch (error) {
      console.error(
        `Error creando notificacion para ${progress.collaboratorId}:`,
        error
      )
      failureCount++
    }
  }

  await prisma.notificationLog.create({
    data: {
      type: notificationType,
      channel,
      recipientCount: eligibleRecipients.length,
      successCount,
      failureCount,
      subject: `Recordatorios de vencimiento (${daysBeforeExpiration} dias)`,
      metadata: {
        daysBeforeExpiration,
        targetDate: targetDate.toISOString(),
      },
      sentBy: options.sentBy,
    },
  })

  return {
    totalRecords: eligibleRecipients.length,
    successCount,
    failureCount,
  }
}

export async function generateTeamSummary(options?: {
  areaId?: string
  siteId?: string
  sendEmail?: boolean
  sentBy?: string
}) {
  const channel = options?.sendEmail === false ? "IN_APP" : "BOTH"

  const areaHeads = await prisma.areaHeadHistory.findMany({
    where: {
      endDate: null,
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

    const teamMembers = areaHead.area.collaborators
    const totalPendingCourses = teamMembers.reduce(
      (sum, member) => sum + member.courseProgress.length,
      0
    )

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

    const bodyHtml = `
      <h2>Resumen Semanal - Area: ${areaHead.area.name}</h2>
      <p>Estimado/a ${areaHead.collaborator.fullName},</p>
      <p>Este es el resumen de capacitaciones pendientes de su equipo:</p>

      <h3>Estadisticas Generales</h3>
      <ul>
        <li><strong>Total de colaboradores:</strong> ${teamMembers.length}</li>
        <li><strong>Cursos pendientes totales:</strong> ${totalPendingCourses}</li>
        <li><strong>Cursos proximos a vencer (7 dias):</strong> ${upcomingCourses.length}</li>
      </ul>

      ${
        upcomingCourses.length > 0
          ? `
        <h3>Cursos Proximos a Vencer</h3>
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
Resumen Semanal - Area: ${areaHead.area.name}

Estimado/a ${areaHead.collaborator.fullName},

Este es el resumen de capacitaciones pendientes de su equipo:

Estadisticas Generales:
- Total de colaboradores: ${teamMembers.length}
- Cursos pendientes totales: ${totalPendingCourses}
- Cursos proximos a vencer (7 dias): ${upcomingCourses.length}

${
  upcomingCourses.length > 0
    ? `
Cursos Proximos a Vencer:
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
        channel,
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

  await prisma.notificationLog.create({
    data: {
      type: "TEAM_SUMMARY",
      channel,
      recipientCount: areaHeads.length,
      successCount,
      failureCount,
      subject: "Resumen semanal para jefes de area",
      metadata: {
        areaId: options?.areaId,
        siteId: options?.siteId,
      },
      sentBy: options?.sentBy,
    },
  })

  return {
    totalRecipients: areaHeads.length,
    successCount,
    failureCount,
  }
}

export async function markNotificationAsRead(notificationId: string) {
  return prisma.notification.update({
    where: { id: notificationId },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  })
}

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

export async function archiveNotification(notificationId: string) {
  return prisma.notification.update({
    where: { id: notificationId },
    data: {
      isArchived: true,
      archivedAt: new Date(),
    },
  })
}

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

export async function countUnreadNotifications(userId: string) {
  return prisma.notification.count({
    where: {
      userId,
      isRead: false,
      isArchived: false,
    },
  })
}
