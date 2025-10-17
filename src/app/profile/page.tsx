import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { ClientProfileView } from "./client-profile-view"

export default async function ProfilePage() {
  const session = await auth()

  if (!session?.user || !session.user.collaboratorId) {
    redirect("/login")
  }

  // Obtener datos completos del colaborador
  const collaborator = await prisma.collaborator.findUnique({
    where: {
      id: session.user.collaboratorId,
    },
    include: {
      site: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
      area: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
      position: {
        select: {
          id: true,
          name: true,
        },
      },
      user: {
        select: {
          id: true,
          email: true,
          image: true,
        },
      },
    },
  })

  if (!collaborator) {
    redirect("/login")
  }

  // Serializar datos para pasarlos al cliente
  const profileData = {
    id: collaborator.id,
    dni: collaborator.dni,
    fullName: collaborator.fullName,
    email: collaborator.email,
    status: collaborator.status,
    entryDate: collaborator.entryDate.toISOString(),
    site: collaborator.site
      ? {
          id: collaborator.site.id,
          name: collaborator.site.name,
          code: collaborator.site.code,
        }
      : null,
    area: collaborator.area
      ? {
          id: collaborator.area.id,
          name: collaborator.area.name,
          code: collaborator.area.code,
        }
      : null,
    position: collaborator.position
      ? {
          id: collaborator.position.id,
          name: collaborator.position.name,
        }
      : null,
    user: collaborator.user
      ? {
          id: collaborator.user.id,
          email: collaborator.user.email || "",
          image: collaborator.user.image,
        }
      : null,
  }

  return <ClientProfileView profile={profileData} />
}
