"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, MoveUp, MoveDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { CreateQuestionSchema, type CreateQuestionInput } from "@/validations/quiz";

type QuestionFormProps = {
  question?: any;
  onSuccess: () => void;
};

export function QuestionForm({ question, onSuccess }: QuestionFormProps) {
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState(question?.type || "SINGLE_CHOICE");
  const [options, setOptions] = useState(
    question?.options || [
      { optionText: "", isCorrect: false, order: 1 },
      { optionText: "", isCorrect: false, order: 2 },
    ]
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      questionText: formData.get("questionText") as string,
      type,
      points: parseInt(formData.get("points") as string) || 1,
      topic: formData.get("topic") as string || undefined,
      difficulty: parseInt(formData.get("difficulty") as string) || 5,
      correctFeedback: formData.get("correctFeedback") as string || undefined,
      incorrectFeedback: formData.get("incorrectFeedback") as string || undefined,
      explanation: formData.get("explanation") as string || undefined,
      options,
    };

    try {
      const validatedData = CreateQuestionSchema.parse(data);
      
      const url = question ? `/api/questions/${question.id}` : "/api/questions";
      const method = question ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validatedData),
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
          name="questionText"
          defaultValue={question?.questionText}
          required
          rows={3}
          placeholder="Escribe la pregunta aquí..."
        />
      </div>

      {/* Tema y Puntos */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="topic">Tema</Label>
          <Input
            id="topic"
            name="topic"
            defaultValue={question?.topic}
            placeholder="Ej: Seguridad"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="points">Puntos *</Label>
          <Input
            id="points"
            name="points"
            type="number"
            min="1"
            defaultValue={question?.points || 1}
            required
          />
        </div>
      </div>

      {/* Dificultad */}
      <div className="space-y-2">
        <Label htmlFor="difficulty">Dificultad (1-10)</Label>
        <Input
          id="difficulty"
          name="difficulty"
          type="number"
          min="1"
          max="10"
          defaultValue={question?.difficulty || 5}
        />
      </div>

      <Separator />

      {/* Opciones */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Label>Opciones de respuesta *</Label>
          {type !== "TRUE_FALSE" && (
            <Button type="button" variant="outline" size="sm" onClick={addOption}>
              <Plus className="h-4 w-4 mr-2" />
              Agregar opción
            </Button>
          )}
        </div>

        {options.map((option: any, index: number) => (
          <div key={index} className="flex gap-2 items-start">
            <Checkbox
              checked={option.isCorrect}
              onCheckedChange={(checked) => updateOption(index, "isCorrect", checked)}
              className="mt-3"
            />
            <div className="flex-1">
              <Input
                value={option.optionText}
                onChange={(e) => updateOption(index, "optionText", e.target.value)}
                placeholder={`Opción ${index + 1}`}
                required
              />
            </div>
            {type === "ORDER" && (
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => moveOption(index, "up")}
                  disabled={index === 0}
                >
                  <MoveUp className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => moveOption(index, "down")}
                  disabled={index === options.length - 1}
                >
                  <MoveDown className="h-4 w-4" />
                </Button>
              </div>
            )}
            {type !== "TRUE_FALSE" && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeOption(index)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            )}
          </div>
        ))}
      </div>

      <Separator />

      {/* Retroalimentación */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="correctFeedback">Retroalimentación (correcta)</Label>
          <Textarea
            id="correctFeedback"
            name="correctFeedback"
            defaultValue={question?.correctFeedback}
            rows={2}
            placeholder="Mensaje cuando responda correctamente..."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="incorrectFeedback">Retroalimentación (incorrecta)</Label>
          <Textarea
            id="incorrectFeedback"
            name="incorrectFeedback"
            defaultValue={question?.incorrectFeedback}
            rows={2}
            placeholder="Mensaje cuando responda incorrectamente..."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="explanation">Explicación</Label>
          <Textarea
            id="explanation"
            name="explanation"
            defaultValue={question?.explanation}
            rows={3}
            placeholder="Explicación detallada de la respuesta..."
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="submit" disabled={loading}>
          {loading ? "Guardando..." : question ? "Actualizar" : "Crear"}
        </Button>
      </div>
    </form>
  );
}
