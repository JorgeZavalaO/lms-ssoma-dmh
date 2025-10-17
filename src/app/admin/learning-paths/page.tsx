import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { ClientLearningPaths } from "./client-paths"

async function fetchLearningPaths() {
  return await prisma.learningPath.findMany({
    include: {
      courses: {
        include: {
          course: {
            select: {
              id: true,
              code: true,
              name: true,
              duration: true,
              status: true,
            }
          },
          prerequisite: {
            include: {
              course: {
                select: {
                  id: true,
                  code: true,
                  name: true,
                }
              }
            }
          }
        },
        orderBy: { order: "asc" }
      },
      _count: {
        select: {
          courses: true,
        }
      }
    },
    orderBy: { createdAt: "desc" }
  })
}

export default async function LearningPathsPage() {
  const session = await auth()
  
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
    redirect("/")
  }
  
  const paths = await fetchLearningPaths()
  
  return <ClientLearningPaths initialPaths={paths} />
}
