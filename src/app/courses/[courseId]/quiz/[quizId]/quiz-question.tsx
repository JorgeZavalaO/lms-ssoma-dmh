"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type QuizQuestionProps = {
  question: any;
  questionNumber: number;
  answer: any;
  onAnswer: (answer: any) => void;
};

export function QuizQuestion({ question, questionNumber, answer, onAnswer }: QuizQuestionProps) {
  const renderQuestionInput = () => {
    switch (question.type) {
      case "SINGLE_CHOICE":
        return (
          <RadioGroup value={answer || ""} onValueChange={onAnswer}>
            <div className="space-y-3">
              {question.options.map((option: any) => (
                <div key={option.id} className="flex items-center space-x-3">
                  <RadioGroupItem value={option.id} id={option.id} />
                  <Label
                    htmlFor={option.id}
                    className="flex-1 cursor-pointer p-3 rounded-lg border hover:bg-accent"
                  >
                    {option.text}
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        );

      case "MULTIPLE_CHOICE":
        const selected = answer || [];
        return (
          <div className="space-y-3">
            {question.options.map((option: any) => (
              <div key={option.id} className="flex items-center space-x-3">
                <Checkbox
                  id={option.id}
                  checked={selected.includes(option.id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      onAnswer([...selected, option.id]);
                    } else {
                      onAnswer(selected.filter((id: string) => id !== option.id));
                    }
                  }}
                />
                <Label
                  htmlFor={option.id}
                  className="flex-1 cursor-pointer p-3 rounded-lg border hover:bg-accent"
                >
                  {option.text}
                </Label>
              </div>
            ))}
          </div>
        );

      case "TRUE_FALSE":
        return (
          <RadioGroup value={answer || ""} onValueChange={onAnswer}>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="true" id="true" />
                <Label
                  htmlFor="true"
                  className="flex-1 cursor-pointer p-3 rounded-lg border hover:bg-accent"
                >
                  Verdadero
                </Label>
              </div>
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="false" id="false" />
                <Label
                  htmlFor="false"
                  className="flex-1 cursor-pointer p-3 rounded-lg border hover:bg-accent"
                >
                  Falso
                </Label>
              </div>
            </div>
          </RadioGroup>
        );

      case "ORDER":
        const orderedItems = answer || question.options.map((opt: any) => opt.id);
        return (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground mb-3">
              Arrastra para ordenar (o usa los números para indicar el orden)
            </p>
            {orderedItems.map((optionId: string, index: number) => {
              const option = question.options.find((opt: any) => opt.id === optionId);
              return (
                <div
                  key={optionId}
                  className="flex items-center gap-3 p-3 border rounded-lg bg-background"
                >
                  <Badge variant="outline" className="w-8 h-8 flex items-center justify-center">
                    {index + 1}
                  </Badge>
                  <div className="flex-1">{option?.text}</div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        if (index === 0) return;
                        const newOrder = [...orderedItems];
                        [newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]];
                        onAnswer(newOrder);
                      }}
                      disabled={index === 0}
                      className="px-2 py-1 text-sm border rounded disabled:opacity-50"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (index === orderedItems.length - 1) return;
                        const newOrder = [...orderedItems];
                        [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
                        onAnswer(newOrder);
                      }}
                      disabled={index === orderedItems.length - 1}
                      className="px-2 py-1 text-sm border rounded disabled:opacity-50"
                    >
                      ↓
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        );

      case "FILL_BLANK":
        return (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Completa los espacios en blanco (separa múltiples respuestas con punto y coma)
            </p>
            <Input
              value={answer || ""}
              onChange={(e) => onAnswer(e.target.value)}
              placeholder="Escribe tu respuesta..."
              className="text-base"
            />
            <p className="text-xs text-muted-foreground">
              Ejemplo: Si hay varios espacios, escribe: respuesta1; respuesta2; respuesta3
            </p>
          </div>
        );

      default:
        return <p className="text-muted-foreground">Tipo de pregunta no soportado</p>;
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      SINGLE_CHOICE: "Opción Única",
      MULTIPLE_CHOICE: "Opción Múltiple",
      TRUE_FALSE: "Verdadero/Falso",
      ORDER: "Ordenar",
      FILL_BLANK: "Llenar Espacios",
    };
    return labels[type] || type;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <CardTitle className="text-lg font-semibold">
            {questionNumber}. {question.text}
          </CardTitle>
          <Badge variant="secondary">{getTypeLabel(question.type)}</Badge>
        </div>
        {question.points && (
          <p className="text-sm text-muted-foreground">Puntos: {question.points}</p>
        )}
      </CardHeader>
      <CardContent>{renderQuestionInput()}</CardContent>
    </Card>
  );
}
