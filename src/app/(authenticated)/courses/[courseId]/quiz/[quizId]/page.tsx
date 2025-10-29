import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { QuizTaker } from "./quiz-taker";
import { checkCoursePrerequisites } from "@/lib/access";

type Params = Promise<{ courseId: string; quizId: string }>;

export default async function QuizPage({ params }: { params: Params }) {
  const session = await auth();
  const { courseId, quizId } = await params;

  if (!session?.user) {
    redirect("/login");
  }

  // Obtener el quiz
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: {
      quizQuestions: {
        include: {
          question: {
            include: {
              options: {
                orderBy: { order: "asc" },
              },
            },
          },
        },
        orderBy: { order: "asc" },
      },
    },
  });

  if (!quiz) {
    return (
      <div className="container mx-auto p-8">
        <h1 className="text-2xl font-bold text-destructive">
          Cuestionario no encontrado
        </h1>
      </div>
    );
  }

  // Verificar que esté publicado
  if (quiz.status !== "PUBLISHED") {
    return (
      <div className="container mx-auto p-8">
        <h1 className="text-2xl font-bold text-destructive">
          Este cuestionario no está disponible
        </h1>
      </div>
    );
  }

  // Obtener intentos previos del usuario
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { collaboratorId: true },
  });

  // Validar enrollment al curso y prerequisitos antes de permitir el quiz
  if (!user?.collaboratorId) {
    redirect("/login");
  }

  // Asegurar que el quiz corresponda al courseId de la ruta
  if (quiz.courseId && quiz.courseId !== courseId) {
    redirect(`/courses/${quiz.courseId}`);
  }

  const enrollment = await prisma.enrollment.findFirst({
    where: { collaboratorId: user.collaboratorId, courseId },
  });
  if (!enrollment) {
    redirect("/my-courses");
  }

  const prereq = await checkCoursePrerequisites(user.collaboratorId, courseId);
  if (!prereq.allowed) {
    redirect("/my-learning-paths");
  }

  let attempts: any[] = [];
  attempts = await prisma.quizAttempt.findMany({
    where: {
      quizId,
      collaboratorId: user.collaboratorId,
    },
    orderBy: { attemptNumber: "desc" },
  });

  return (
    <QuizTaker
      quiz={quiz}
      attempts={attempts}
      collaboratorId={user?.collaboratorId || undefined}
    />
  );
}
