"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, XCircle, Trophy, AlertTriangle, RotateCcw, BookOpen } from "lucide-react";
import { toast } from "sonner";

type QuizResultsProps = {
  result: any;
  quiz: any;
  onRetry: () => void;
};

export function QuizResults({ result, quiz, onRetry }: QuizResultsProps) {
  const [completingRemediation, setCompletingRemediation] = useState(false);

  const passed = result.status === "PASSED";
  const scorePercentage = result.score || 0;

  const handleCompleteRemediation = async () => {
    setCompletingRemediation(true);
    try {
      const res = await fetch(`/api/attempts/${result.id}/remediation`, {
        method: "POST",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error);
      }

      toast.success("Remediación completada. Ya puedes volver a intentar.");
      onRetry();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setCompletingRemediation(false);
    }
  };

  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-6">
      {/* Resultado principal */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">Resultados del Examen</CardTitle>
            <Badge
              variant={passed ? "default" : "destructive"}
              className="text-lg px-4 py-2"
            >
              {passed ? (
                <CheckCircle2 className="mr-2 h-5 w-5" />
              ) : (
                <XCircle className="mr-2 h-5 w-5" />
              )}
              {passed ? "Aprobado" : "Reprobado"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Score visual */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-32 h-32 rounded-full border-8 border-primary bg-primary/10">
              <div className="text-center">
                <div className="text-4xl font-bold">{scorePercentage.toFixed(0)}%</div>
                <div className="text-sm text-muted-foreground">Puntaje</div>
              </div>
            </div>
            <Progress value={scorePercentage} className="h-3" />
          </div>

          {/* Estadísticas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">{result.correctAnswers}</div>
              <div className="text-sm text-muted-foreground">Correctas</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {result.totalQuestions - result.correctAnswers}
              </div>
              <div className="text-sm text-muted-foreground">Incorrectas</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold">{result.totalQuestions}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold">{quiz.passingScore}%</div>
              <div className="text-sm text-muted-foreground">Requerido</div>
            </div>
          </div>

          {/* Feedback */}
          {result.feedback && (
            <Alert>
              <AlertDescription className="whitespace-pre-wrap">
                {result.feedback}
              </AlertDescription>
            </Alert>
          )}

          {/* Remediación requerida */}
          {result.requiresRemediation && !result.remediationCompleted && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-3">
                  <p className="font-semibold">Remediación Requerida</p>
                  <p>
                    Debes completar el contenido de remediación antes de volver a intentar el examen.
                  </p>
                  {quiz.remediationUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <a href={quiz.remediationUrl} target="_blank" rel="noopener noreferrer">
                        <BookOpen className="mr-2 h-4 w-4" />
                        Ir al Contenido de Remediación
                      </a>
                    </Button>
                  )}
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleCompleteRemediation}
                    disabled={completingRemediation}
                  >
                    {completingRemediation ? "Marcando..." : "Marcar Remediación como Completada"}
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Detalle de respuestas (si está habilitado) */}
      {quiz.showCorrectAnswers && result.details && (
        <Card>
          <CardHeader>
            <CardTitle>Detalle de Respuestas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {result.details.map((detail: any, index: number) => (
              <div
                key={index}
                className={`p-4 border rounded-lg ${
                  detail.isCorrect ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {detail.isCorrect ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                      <p className="font-medium">Pregunta {index + 1}</p>
                    </div>
                    <p className="text-sm mb-2">{detail.questionText}</p>
                    {!detail.isCorrect && detail.correctAnswer && (
                      <p className="text-sm text-muted-foreground">
                        <span className="font-semibold">Respuesta correcta:</span>{" "}
                        {detail.correctAnswer}
                      </p>
                    )}
                    {detail.explanation && (
                      <Alert className="mt-3">
                        <AlertDescription className="text-sm">
                          {detail.explanation}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                  <Badge variant={detail.isCorrect ? "default" : "destructive"}>
                    {detail.earnedPoints || 0} / {detail.maxPoints || 0} pts
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Acciones */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-center">
            <Button variant="outline" onClick={() => window.history.back()}>
              Volver al Curso
            </Button>

            {!passed && result.remediationCompleted && (
              <Button onClick={onRetry}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Volver a Intentar
              </Button>
            )}

            {passed && (
              <Button variant="default">
                <Trophy className="mr-2 h-4 w-4" />
                ¡Continuar con el Curso!
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
