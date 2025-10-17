"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Search, X } from "lucide-react";

type QuizFormProps = {
  quiz?: any;
  onSuccess: () => void;
};

type Question = {
  id: string;
  questionText: string;
  type: string;
  topic?: string;
  points: number;
};

const typeLabels: Record<string, string> = {
  SINGLE_CHOICE: "Opción Única",
  MULTIPLE_CHOICE: "Opción Múltiple",
  TRUE_FALSE: "V/F",
  ORDER: "Ordenar",
  FILL_BLANK: "Completar",
};

export function QuizForm({ quiz, onSuccess }: QuizFormProps) {
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>(
    quiz?.quizQuestions?.map((qq: any) => qq.questionId) || []
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("ALL");

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      const res = await fetch("/api/questions");
      if (!res.ok) throw new Error("Error al cargar preguntas");
      const data = await res.json();
      setQuestions(data);
    } catch (error) {
      toast.error("No se pudieron cargar las preguntas");
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get("title") as string,
      description: formData.get("description") as string || undefined,
      instructions: formData.get("instructions") as string || undefined,
      courseId: formData.get("courseId") as string || undefined,
      passingScore: parseInt(formData.get("passingScore") as string) || 70,
      maxAttempts: formData.get("maxAttempts") ? parseInt(formData.get("maxAttempts") as string) : undefined,
      timeLimit: formData.get("timeLimit") ? parseInt(formData.get("timeLimit") as string) : undefined,
      shuffleQuestions: formData.get("shuffleQuestions") === "on",
      shuffleOptions: formData.get("shuffleOptions") === "on",
      questionsPerAttempt: formData.get("questionsPerAttempt") ? parseInt(formData.get("questionsPerAttempt") as string) : undefined,
      showCorrectAnswers: formData.get("showCorrectAnswers") === "on",
      showFeedback: formData.get("showFeedback") === "on",
      showScoreImmediately: formData.get("showScoreImmediately") === "on",
      status: formData.get("status") as string,
      questionIds: selectedQuestions,
    };

    try {
      const url = quiz ? `/api/quizzes/${quiz.id}` : "/api/quizzes";
      const method = quiz ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Error al guardar cuestionario");
      }

      toast.success(quiz ? "Cuestionario actualizado" : "Cuestionario creado");
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Error al guardar cuestionario");
    } finally {
      setLoading(false);
    }
  };

  const toggleQuestion = (questionId: string) => {
    setSelectedQuestions((prev) =>
      prev.includes(questionId)
        ? prev.filter((id) => id !== questionId)
        : [...prev, questionId]
    );
  };

  const filteredQuestions = questions.filter((q) => {
    const matchesSearch = q.questionText.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         q.topic?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "ALL" || q.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Información básica */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Título *</Label>
          <Input
            id="title"
            name="title"
            defaultValue={quiz?.title}
            required
            placeholder="Evaluación de Seguridad Industrial"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Descripción</Label>
          <Textarea
            id="description"
            name="description"
            defaultValue={quiz?.description}
            rows={2}
            placeholder="Descripción del cuestionario..."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="instructions">Instrucciones</Label>
          <Textarea
            id="instructions"
            name="instructions"
            defaultValue={quiz?.instructions}
            rows={3}
            placeholder="Lee cuidadosamente cada pregunta antes de responder..."
          />
        </div>
      </div>

      <Separator />

      {/* Configuración */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="status">Estado *</Label>
          <Select name="status" defaultValue={quiz?.status || "DRAFT"}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DRAFT">Borrador</SelectItem>
              <SelectItem value="PUBLISHED">Publicado</SelectItem>
              <SelectItem value="ARCHIVED">Archivado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="passingScore">Nota Mínima (%) *</Label>
          <Input
            id="passingScore"
            name="passingScore"
            type="number"
            min="0"
            max="100"
            defaultValue={quiz?.passingScore || 70}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="maxAttempts">Intentos Máximos</Label>
          <Input
            id="maxAttempts"
            name="maxAttempts"
            type="number"
            min="1"
            defaultValue={quiz?.maxAttempts}
            placeholder="Ilimitado"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="timeLimit">Tiempo Límite (min)</Label>
          <Input
            id="timeLimit"
            name="timeLimit"
            type="number"
            min="1"
            defaultValue={quiz?.timeLimit}
            placeholder="Sin límite"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="questionsPerAttempt">Preguntas por Intento</Label>
          <Input
            id="questionsPerAttempt"
            name="questionsPerAttempt"
            type="number"
            min="1"
            defaultValue={quiz?.questionsPerAttempt}
            placeholder="Todas"
          />
        </div>
      </div>

      <Separator />

      {/* Opciones de aleatorización */}
      <div className="space-y-4">
        <Label>Aleatorización</Label>
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="shuffleQuestions">Barajar Preguntas</Label>
            <p className="text-sm text-muted-foreground">
              Mostrar preguntas en orden aleatorio
            </p>
          </div>
          <Switch
            id="shuffleQuestions"
            name="shuffleQuestions"
            defaultChecked={quiz?.shuffleQuestions}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="shuffleOptions">Barajar Opciones</Label>
            <p className="text-sm text-muted-foreground">
              Mostrar opciones en orden aleatorio
            </p>
          </div>
          <Switch
            id="shuffleOptions"
            name="shuffleOptions"
            defaultChecked={quiz?.shuffleOptions}
          />
        </div>
      </div>

      <Separator />

      {/* Políticas de visualización */}
      <div className="space-y-4">
        <Label>Visualización de Resultados</Label>
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="showCorrectAnswers">Mostrar Respuestas Correctas</Label>
            <p className="text-sm text-muted-foreground">
              Mostrar cuáles eran las respuestas correctas
            </p>
          </div>
          <Switch
            id="showCorrectAnswers"
            name="showCorrectAnswers"
            defaultChecked={quiz?.showCorrectAnswers ?? true}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="showFeedback">Mostrar Retroalimentación</Label>
            <p className="text-sm text-muted-foreground">
              Mostrar feedback por cada pregunta
            </p>
          </div>
          <Switch
            id="showFeedback"
            name="showFeedback"
            defaultChecked={quiz?.showFeedback ?? true}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="showScoreImmediately">Mostrar Puntuación Inmediatamente</Label>
            <p className="text-sm text-muted-foreground">
              Mostrar la nota al enviar el examen
            </p>
          </div>
          <Switch
            id="showScoreImmediately"
            name="showScoreImmediately"
            defaultChecked={quiz?.showScoreImmediately ?? true}
          />
        </div>
      </div>

      <Separator />

      {/* Selector de preguntas */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Label>Preguntas ({selectedQuestions.length} seleccionadas)</Label>
          <div className="flex gap-2">
            <Input
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-48"
            />
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos los tipos</SelectItem>
                <SelectItem value="SINGLE_CHOICE">Opción Única</SelectItem>
                <SelectItem value="MULTIPLE_CHOICE">Opción Múltiple</SelectItem>
                <SelectItem value="TRUE_FALSE">V/F</SelectItem>
                <SelectItem value="ORDER">Ordenar</SelectItem>
                <SelectItem value="FILL_BLANK">Completar</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="border rounded-lg p-4 max-h-80 overflow-y-auto space-y-2">
          {filteredQuestions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No hay preguntas disponibles
            </p>
          ) : (
            filteredQuestions.map((question) => (
              <div
                key={question.id}
                className="flex items-start gap-3 p-3 border rounded hover:bg-accent cursor-pointer"
                onClick={() => toggleQuestion(question.id)}
              >
                <Checkbox
                  checked={selectedQuestions.includes(question.id)}
                  onCheckedChange={() => toggleQuestion(question.id)}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-xs">
                      {typeLabels[question.type]}
                    </Badge>
                    {question.topic && (
                      <Badge variant="secondary" className="text-xs">
                        {question.topic}
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {question.points} pts
                    </span>
                  </div>
                  <p className="text-sm">{question.questionText}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {selectedQuestions.length === 0 && (
          <p className="text-sm text-destructive">
            Debes seleccionar al menos una pregunta
          </p>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="submit" disabled={loading || selectedQuestions.length === 0}>
          {loading ? "Guardando..." : quiz ? "Actualizar" : "Crear"}
        </Button>
      </div>
    </form>
  );
}
