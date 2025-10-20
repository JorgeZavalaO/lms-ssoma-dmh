import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ClientQuizzes } from "./client-quizzes";

export default async function QuizzesPage() {
  const session = await auth();

  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
    redirect("/");
  }

  return <ClientQuizzes />;
}
