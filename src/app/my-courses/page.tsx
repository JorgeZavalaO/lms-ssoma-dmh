import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { ClientMyCourses } from "./client-my-courses"

export default async function MyCoursesPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  return <ClientMyCourses />
}
