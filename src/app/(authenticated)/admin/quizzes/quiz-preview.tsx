"use client";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, Clock, Trophy, Shuffle } from "lucide-react";

type QuizPreviewProps = {
  quiz: any;
};

const typeLabels: Record<string, string> = {
  SINGLE_CHOICE: "Opción Única",
  MULTIPLE_CHOICE: "Opción Múltiple",
  TRUE_FALSE: "Verdadero/Falso",
  ORDER: "Ordenar",
  FILL_BLANK: "Completar",
};

export function QuizPreview({ quiz }: QuizPreviewProps) {
  const totalPoints = quiz.quizQuestions.reduce(
    (sum: number, qq: any) => sum + (qq.points || qq.question.points),
    0
  );

  return (
    <div className="space-y-6">
      {/* Información general */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            {quiz.status === "DRAFT" && "Borrador"}
            {quiz.status === "PUBLISHED" && "Publicado"}
            {quiz.status === "ARCHIVED" && "Archivado"}
          </Badge>
          {quiz.timeLimit && (
            <Badge variant="secondary" className="text-sm">
              <Clock className="h-3 w-3 mr-1" />
              {quiz.timeLimit} minutos
            </Badge>
          )}
          {(quiz.shuffleQuestions || quiz.shuffleOptions) && (
            <Badge variant="secondary" className="text-sm">
              <Shuffle className="h-3 w-3 mr-1" />
              Aleatorizado
            </Badge>
          )}
        </div>

        {quiz.description && (
          <p className="text-sm text-muted-foreground">{quiz.description}</p>
        )}

        {quiz.instructions && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Instrucciones</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{quiz.instructions}</p>
            </CardContent>
          </Card>
        )}
      </div>

      <Separator />

      {/* Configuración */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Nota Mínima
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{quiz.passingScore}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Intentos Permitidos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {quiz.maxAttempts || "Ilimitado"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total de Preguntas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{quiz.quizQuestions.length}</p>
            {quiz.questionsPerAttempt && (
              <p className="text-xs text-muted-foreground mt-1">
                {quiz.questionsPerAttempt} por intento
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Puntos Totales</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalPoints}</p>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Opciones */}
      <div className="space-y-2">
        <h3 className="font-semibold text-sm">Configuración</h3>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2">
            {quiz.shuffleQuestions ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <XCircle className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="text-sm">Barajar preguntas</span>
          </div>

          <div className="flex items-center gap-2">
            {quiz.shuffleOptions ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <XCircle className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="text-sm">Barajar opciones</span>
          </div>

          <div className="flex items-center gap-2">
            {quiz.showCorrectAnswers ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <XCircle className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="text-sm">Mostrar respuestas correctas</span>
          </div>

          <div className="flex items-center gap-2">
            {quiz.showFeedback ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <XCircle className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="text-sm">Mostrar retroalimentación</span>
          </div>

          <div className="flex items-center gap-2">
            {quiz.showScoreImmediately ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <XCircle className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="text-sm">Mostrar puntuación inmediata</span>
          </div>
        </div>
      </div>

      <Separator />

      {/* Preguntas */}
      <div className="space-y-3">
        <h3 className="font-semibold">Preguntas ({quiz.quizQuestions.length})</h3>
        {quiz.quizQuestions.map((qq: any, index: number) => (
          <Card key={qq.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-semibold">#{index + 1}</span>
                    <Badge variant="outline" className="text-xs">
                      {typeLabels[qq.question.type]}
                    </Badge>
                    {qq.question.topic && (
                      <Badge variant="secondary" className="text-xs">
                        {qq.question.topic}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm">{qq.question.questionText}</p>
                </div>
                <Badge variant="outline" className="ml-2">
                  {qq.points || qq.question.points} pts
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {qq.question.options.map((opt: any, optIndex: number) => (
                  <div
                    key={opt.id}
                    className={`text-sm p-2 rounded ${
                      opt.isCorrect
                        ? "bg-green-50 border border-green-200"
                        : "bg-muted"
                    }`}
                  >
                    <span className="font-medium mr-2">
                      {String.fromCharCode(65 + optIndex)}.
                    </span>
                    {opt.optionText}
                    {opt.isCorrect && (
                      <CheckCircle2 className="h-4 w-4 text-green-600 inline ml-2" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
