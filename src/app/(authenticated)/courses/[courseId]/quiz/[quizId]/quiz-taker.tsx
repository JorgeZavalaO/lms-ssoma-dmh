"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Clock, CheckCircle2, XCircle, AlertTriangle, Trophy, PlayCircle } from "lucide-react";
import { QuizQuestion } from "./quiz-question";
import { QuizResults } from "./quiz-results";

type QuizTakerProps = {
  quiz: any;
  attempts: any[];
  collaboratorId?: string;
};

export function QuizTaker({ quiz, attempts, collaboratorId }: QuizTakerProps) {
  const router = useRouter();
  const [activeAttempt, setActiveAttempt] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const lastAttempt = attempts[0];
  const canStartNew =
    !lastAttempt ||
    lastAttempt.status !== "IN_PROGRESS" &&
    (!quiz.maxAttempts || attempts.length < quiz.maxAttempts) &&
    (!lastAttempt.requiresRemediation || lastAttempt.remediationCompleted);

  useEffect(() => {
    // Si hay un intento en progreso, cargarlo
    if (lastAttempt?.status === "IN_PROGRESS") {
      loadAttempt(lastAttempt);
    }
  }, []);

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const loadAttempt = async (attempt: any) => {
    try {
      const res = await fetch(`/api/quizzes/${quiz.id}/attempt`, {
        method: "POST",
      });

      if (!res.ok) throw new Error("Error al cargar intento");
      const data = await res.json();

      setActiveAttempt(data.attempt);
      setQuestions(data.questions);
      setAnswers(attempt.answers || {});

      if (quiz.timeLimit) {
        const elapsed = Math.floor(
          (new Date().getTime() - new Date(attempt.startedAt).getTime()) / 1000
        );
        const remaining = quiz.timeLimit * 60 - elapsed;
        setTimeLeft(Math.max(0, remaining));
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const startNewAttempt = async () => {
    try {
      const res = await fetch(`/api/quizzes/${quiz.id}/attempt`, {
        method: "POST",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error);
      }

      const data = await res.json();
      setActiveAttempt(data.attempt);
      setQuestions(data.questions);
      setAnswers({});

      if (quiz.timeLimit) {
        setTimeLeft(quiz.timeLimit * 60);
      }

      toast.success("¡Examen iniciado! Buena suerte.");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleAnswer = (questionId: string, answer: any) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmit = async () => {
    if (submitting) return;

    const unanswered = questions.filter((q) => !answers[q.id]);
    if (unanswered.length > 0) {
      const confirm = window.confirm(
        `Tienes ${unanswered.length} pregunta(s) sin responder. ¿Deseas enviar de todas formas?`
      );
      if (!confirm) return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(`/api/attempts/${activeAttempt.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attemptId: activeAttempt.id,
          answers,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error);
      }

      const data = await res.json();
      setResult(data);
      setTimeLeft(null);
      toast.success("¡Examen enviado!");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Vista de resultados
  if (result) {
    return <QuizResults result={result} quiz={quiz} onRetry={() => router.refresh()} />;
  }

  // Vista de inicio
  if (!activeAttempt) {
    return (
      <div className="container max-w-4xl mx-auto p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{quiz.title}</CardTitle>
            {quiz.description && (
              <p className="text-muted-foreground">{quiz.description}</p>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {quiz.instructions && (
              <Alert>
                <AlertDescription className="whitespace-pre-wrap">
                  {quiz.instructions}
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold">{quiz.quizQuestions.length}</div>
                <div className="text-sm text-muted-foreground">Preguntas</div>
              </div>

              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold">{quiz.passingScore}%</div>
                <div className="text-sm text-muted-foreground">Nota Mínima</div>
              </div>

              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold">
                  {quiz.timeLimit ? `${quiz.timeLimit} min` : "∞"}
                </div>
                <div className="text-sm text-muted-foreground">Tiempo</div>
              </div>

              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold">
                  {quiz.maxAttempts || "∞"}
                </div>
                <div className="text-sm text-muted-foreground">Intentos</div>
              </div>
            </div>

            {/* Historial de intentos */}
            {attempts.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold">Intentos Previos</h3>
                {attempts.map((attempt) => (
                  <div
                    key={attempt.id}
                    className="flex items-center justify-between p-3 border rounded"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-medium">Intento {attempt.attemptNumber}</span>
                      {attempt.status === "PASSED" && (
                        <Badge variant="default" className="gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Aprobado
                        </Badge>
                      )}
                      {attempt.status === "FAILED" && (
                        <Badge variant="destructive" className="gap-1">
                          <XCircle className="h-3 w-3" />
                          Reprobado
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {attempt.score?.toFixed(1)}%
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Advertencias */}
            {lastAttempt?.requiresRemediation && !lastAttempt.remediationCompleted && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Debes completar el contenido de remediación antes de volver a intentar.
                </AlertDescription>
              </Alert>
            )}

            {quiz.maxAttempts && attempts.length >= quiz.maxAttempts && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Has alcanzado el número máximo de intentos ({quiz.maxAttempts}).
                </AlertDescription>
              </Alert>
            )}

            {/* Botón de iniciar */}
            <Button
              size="lg"
              className="w-full"
              onClick={startNewAttempt}
              disabled={!canStartNew || !collaboratorId}
            >
              <PlayCircle className="mr-2 h-5 w-5" />
              {attempts.length === 0 ? "Iniciar Examen" : `Intento ${attempts.length + 1}`}
            </Button>

            {!collaboratorId && (
              <Alert variant="destructive">
                <AlertDescription>
                  No tienes un perfil de colaborador asociado.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Vista de examen en progreso
  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-6">
      {/* Header con info */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Badge variant="outline">
                Pregunta {currentQuestionIndex + 1} de {questions.length}
              </Badge>
              <Badge variant="secondary">
                {answeredCount} / {questions.length} respondidas
              </Badge>
            </div>

            {timeLeft !== null && (
              <div className="flex items-center gap-2">
                <Clock className={`h-4 w-4 ${timeLeft < 300 ? "text-destructive" : ""}`} />
                <span className={`font-mono font-bold ${timeLeft < 300 ? "text-destructive" : ""}`}>
                  {formatTime(timeLeft)}
                </span>
              </div>
            )}
          </div>

          <Progress value={progress} className="h-2" />
        </CardContent>
      </Card>

      {/* Pregunta actual */}
      <QuizQuestion
        question={currentQuestion}
        questionNumber={currentQuestionIndex + 1}
        answer={answers[currentQuestion.id]}
        onAnswer={(answer) => handleAnswer(currentQuestion.id, answer)}
      />

      {/* Navegación */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentQuestionIndex === 0}
            >
              Anterior
            </Button>

            <div className="flex gap-2">
              {questions.map((_: any, index: number) => (
                <button
                  key={index}
                  onClick={() => setCurrentQuestionIndex(index)}
                  className={`w-8 h-8 rounded border text-sm font-medium ${
                    index === currentQuestionIndex
                      ? "bg-primary text-primary-foreground"
                      : answers[questions[index].id]
                      ? "bg-green-100 border-green-300"
                      : "bg-background"
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>

            {currentQuestionIndex === questions.length - 1 ? (
              <Button onClick={handleSubmit} disabled={submitting}>
                <Trophy className="mr-2 h-4 w-4" />
                {submitting ? "Enviando..." : "Finalizar Examen"}
              </Button>
            ) : (
              <Button
                onClick={() => setCurrentQuestionIndex((prev) => Math.min(questions.length - 1, prev + 1))}
              >
                Siguiente
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
