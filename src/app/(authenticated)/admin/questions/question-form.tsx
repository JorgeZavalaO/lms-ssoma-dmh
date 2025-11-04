"use client";

import { useState } from "react";
import { Plus, Trash2, MoveUp, MoveDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { QuestionPreviewDialog } from "@/components/admin/questions/preview-dialog";

type QuestionFormProps = {
  question?: any;
  onSuccess: () => void;
};

export function QuestionForm({ question, onSuccess }: QuestionFormProps) {
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState(question?.type || "SINGLE_CHOICE");
  const [questionText, setQuestionText] = useState(question?.questionText || "");
  const [topic, setTopic] = useState(question?.topic || "");
  const [points, setPoints] = useState(question?.points?.toString() || "1");
  const [difficulty, setDifficulty] = useState(question?.difficulty?.toString() || "5");
  const [correctFeedback, setCorrectFeedback] = useState(question?.correctFeedback || "");
  const [incorrectFeedback, setIncorrectFeedback] = useState(question?.incorrectFeedback || "");
  const [explanation, setExplanation] = useState(question?.explanation || "");
  const [options, setOptions] = useState(
    question?.options || [
      { optionText: "", isCorrect: false, order: 1 },
      { optionText: "", isCorrect: false, order: 2 },
    ]
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const data = {
      questionText,
      type,
      points: parseInt(points) || 1,
      topic: topic || undefined,
      difficulty: parseInt(difficulty) || 5,
      correctFeedback: correctFeedback || undefined,
      incorrectFeedback: incorrectFeedback || undefined,
      explanation: explanation || undefined,
      options,
    };

    try {
      const url = question ? `/api/questions/${question.id}` : "/api/questions";
      const method = question ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Error al guardar pregunta");
      }

      toast.success(question ? "Pregunta actualizada" : "Pregunta creada");
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Error al guardar pregunta");
    } finally {
      setLoading(false);
    }
  };

  const addOption = () => {
    setOptions([...options, { optionText: "", isCorrect: false, order: options.length + 1 }]);
  };

  const removeOption = (index: number) => {
    if (options.length <= 2) {
      toast.error("Debe haber al menos 2 opciones");
      return;
    }
    const newOptions = options.filter((_: any, i: number) => i !== index);
    setOptions(newOptions.map((opt: any, i: number) => ({ ...opt, order: i + 1 })));
  };

  const moveOption = (index: number, direction: "up" | "down") => {
    const newOptions = [...options];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= options.length) return;
    [newOptions[index], newOptions[targetIndex]] = [newOptions[targetIndex], newOptions[index]];
    setOptions(newOptions.map((opt, i) => ({ ...opt, order: i + 1 })));
  };

  const updateOption = (index: number, field: string, value: any) => {
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], [field]: value };
    
    // Para SINGLE_CHOICE y TRUE_FALSE, solo una opción puede ser correcta
    if ((type === "SINGLE_CHOICE" || type === "TRUE_FALSE") && field === "isCorrect" && value) {
      newOptions.forEach((opt, i) => {
        if (i !== index) opt.isCorrect = false;
      });
    }
    
    setOptions(newOptions);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Tipo de pregunta */}
      <div className="space-y-2">
        <Label>Tipo de pregunta *</Label>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="SINGLE_CHOICE">Opción Única</SelectItem>
            <SelectItem value="MULTIPLE_CHOICE">Opción Múltiple</SelectItem>
            <SelectItem value="TRUE_FALSE">Verdadero/Falso</SelectItem>
            <SelectItem value="ORDER">Ordenar</SelectItem>
            <SelectItem value="FILL_BLANK">Completar</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Pregunta */}
      <div className="space-y-2">
        <Label htmlFor="questionText">Pregunta *</Label>
        <Textarea
          id="questionText"
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          required
          rows={3}
          placeholder="Escribe la pregunta aquí..."
          className="resize-none"
        />
        <p className="text-xs text-muted-foreground">
          {questionText.length} caracteres
        </p>
      </div>

      {/* Tema y Puntos */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="topic">Tema</Label>
          <Input
            id="topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Ej: Seguridad"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="points">Puntos *</Label>
          <Input
            id="points"
            value={points}
            onChange={(e) => setPoints(e.target.value)}
            type="number"
            min="1"
            required
          />
        </div>
      </div>

      {/* Dificultad */}
      <div className="space-y-2">
        <Label>
          Dificultad: <Badge variant="secondary">{difficulty}/10</Badge>
        </Label>
        <Input
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
          type="range"
          min="1"
          max="10"
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Fácil</span>
          <span>Difícil</span>
        </div>
      </div>

      <Separator />

      {/* Opciones */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Label>Opciones de respuesta *</Label>
          {type !== "TRUE_FALSE" && (
            <Button type="button" variant="outline" size="sm" onClick={addOption}>
              <Plus className="h-4 w-4 mr-2" />
              Agregar
            </Button>
          )}
        </div>

        <div className="space-y-3">
          {options.map((option: any, index: number) => (
            <Card key={index} className="border-l-4 border-l-muted">
              <CardContent className="pt-4">
                <div className="flex gap-3 items-start">
                  <Checkbox
                    id={`correct-${index}`}
                    checked={option.isCorrect}
                    onCheckedChange={(checked) => updateOption(index, "isCorrect", checked)}
                    className="mt-1"
                  />
                  <div className="flex-1 space-y-2">
                    <Input
                      value={option.optionText}
                      onChange={(e) => updateOption(index, "optionText", e.target.value)}
                      placeholder={`Opción ${index + 1}`}
                      required
                      className="text-sm"
                    />
                    <div className="flex gap-1 items-center">
                      {option.isCorrect && (
                        <Badge variant="default" className="text-xs">
                          Correcta
                        </Badge>
                      )}
                      {type === "SINGLE_CHOICE" && (
                        <span className="text-xs text-muted-foreground">
                          {type === "SINGLE_CHOICE" && !option.isCorrect
                            ? "(solo una puede ser correcta)"
                            : ""}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {type === "ORDER" && (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => moveOption(index, "up")}
                          disabled={index === 0}
                          title="Mover arriba"
                        >
                          <MoveUp className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => moveOption(index, "down")}
                          disabled={index === options.length - 1}
                          title="Mover abajo"
                        >
                          <MoveDown className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    {type !== "TRUE_FALSE" && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeOption(index)}
                        title="Eliminar opción"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Separator />

      {/* Retroalimentación */}
      <div className="space-y-4">
        <h4 className="font-medium">Retroalimentación</h4>

        <div className="space-y-2">
          <Label htmlFor="correctFeedback">
            Cuando es correcta
            <Badge variant="outline" className="ml-2">Opcional</Badge>
          </Label>
          <Textarea
            id="correctFeedback"
            value={correctFeedback}
            onChange={(e) => setCorrectFeedback(e.target.value)}
            rows={2}
            placeholder="Mensaje cuando responda correctamente..."
            className="resize-none"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="incorrectFeedback">
            Cuando es incorrecta
            <Badge variant="outline" className="ml-2">Opcional</Badge>
          </Label>
          <Textarea
            id="incorrectFeedback"
            value={incorrectFeedback}
            onChange={(e) => setIncorrectFeedback(e.target.value)}
            rows={2}
            placeholder="Mensaje cuando responda incorrectamente..."
            className="resize-none"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="explanation">
            Explicación detallada
            <Badge variant="outline" className="ml-2">Opcional</Badge>
          </Label>
          <Textarea
            id="explanation"
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            rows={3}
            placeholder="Explicación detallada de la respuesta..."
            className="resize-none"
          />
        </div>
      </div>

      {/* Acciones */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        <QuestionPreviewDialog
          type={type}
          questionText={questionText}
          topic={topic}
          points={points}
          difficulty={difficulty}
          options={options}
          correctFeedback={correctFeedback}
          incorrectFeedback={incorrectFeedback}
          explanation={explanation}
        />
        <Button type="submit" disabled={loading}>
          {loading ? "Guardando..." : question ? "Actualizar" : "Crear"}
        </Button>
      </div>
    </form>
  );
}
