import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ClientQuestions } from "./client-questions";

export default async function QuestionsPage() {
  const session = await auth();

  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
    redirect("/");
  }

  return <ClientQuestions />;
}
