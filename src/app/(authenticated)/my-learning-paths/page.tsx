import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { ClientMyLearningPaths } from "./client-my-learning-paths"

export default async function MyLearningPathsPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  return <ClientMyLearningPaths />
}
