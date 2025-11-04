"use client";

import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

type QuestionPreviewDialogProps = {
  type: string;
  questionText: string;
  topic: string;
  points: string;
  difficulty: string;
  options: Array<{ optionText: string; isCorrect: boolean; order: number }>;
  correctFeedback: string;
  incorrectFeedback: string;
  explanation: string;
};

const typeLabels: Record<string, string> = {
  SINGLE_CHOICE: "Opción Única",
  MULTIPLE_CHOICE: "Opción Múltiple",
  TRUE_FALSE: "Verdadero/Falso",
  ORDER: "Ordenar",
  FILL_BLANK: "Completar",
};

export function QuestionPreviewDialog({
  type,
  questionText,
  topic,
  points,
  difficulty,
  options,
  correctFeedback,
  incorrectFeedback,
  explanation,
}: QuestionPreviewDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <Eye className="h-4 w-4 mr-2" />
          Vista previa
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Vista Previa de la Pregunta</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Metadatos */}
          <div className="space-y-3 text-sm pb-4 border-b">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tipo:</span>
              <Badge>{typeLabels[type]}</Badge>
            </div>
            {topic && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tema:</span>
                <span>{topic}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Puntos:</span>
              <Badge variant="secondary">{points} pts</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Dificultad:</span>
              <span>{difficulty}/10</span>
            </div>
          </div>

          {/* Pregunta */}
          <div className="space-y-3">
            <p className="font-semibold text-base">{questionText || "Pregunta..."}</p>

            {/* Opciones */}
            <div className="space-y-2">
              {options.map((option: any, idx: number) => (
                <div
                  key={idx}
                  className={`p-3 rounded border text-sm ${
                    option.isCorrect
                      ? "border-green-500 bg-green-50 dark:bg-green-950"
                      : "border-muted"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-muted-foreground">
                      {type === "SINGLE_CHOICE" || type === "MULTIPLE_CHOICE"
                        ? "○"
                        : "□"}
                    </span>
                    <div className="flex-1">
                      <p>{option.optionText || `Opción ${idx + 1}`}</p>
                      {option.isCorrect && (
                        <Badge variant="default" className="mt-1 text-xs">
                          ✓ Correcta
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Retroalimentación y explicación */}
          {(correctFeedback || incorrectFeedback || explanation) && (
            <>
              <Separator />
              <div className="space-y-3 text-xs">
                {correctFeedback && (
                  <div className="p-3 rounded bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
                    <p className="font-semibold text-green-900 dark:text-green-100 mb-1">
                      ✓ Correcto
                    </p>
                    <p className="text-green-800 dark:text-green-200">{correctFeedback}</p>
                  </div>
                )}
                {incorrectFeedback && (
                  <div className="p-3 rounded bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
                    <p className="font-semibold text-red-900 dark:text-red-100 mb-1">
                      ✗ Incorrecto
                    </p>
                    <p className="text-red-800 dark:text-red-200">{incorrectFeedback}</p>
                  </div>
                )}
                {explanation && (
                  <div className="p-3 rounded bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
                    <p className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                      ℹ Explicación
                    </p>
                    <p className="text-blue-800 dark:text-blue-200">{explanation}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
