"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

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

  // Puntuación total basada en las preguntas seleccionadas
  const totalPoints = selectedQuestions.reduce((sum, id) => {
    const q = questions.find((qq) => qq.id === id);
    return sum + (q?.points || 0);
  }, 0);
  const targetPoints = 20;
  const remainingPoints = Math.max(0, targetPoints - totalPoints);
  const exceeds = totalPoints > targetPoints;

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Información básica */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground tracking-tight">Información General</h3>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="title" className="text-xs font-medium uppercase tracking-wide">Título *</Label>
            <Input
              id="title"
              name="title"
              defaultValue={quiz?.title}
              required
              placeholder="Evaluación de Seguridad Industrial"
              className="border-slate-200 dark:border-slate-700 focus:ring-1 focus:ring-slate-300 dark:focus:ring-slate-600"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-xs font-medium uppercase tracking-wide">Descripción</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={quiz?.description}
              rows={2}
              placeholder="Descripción del cuestionario..."
              className="border-slate-200 dark:border-slate-700 focus:ring-1 focus:ring-slate-300 dark:focus:ring-slate-600 resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="instructions" className="text-xs font-medium uppercase tracking-wide">Instrucciones</Label>
            <Textarea
              id="instructions"
              name="instructions"
              defaultValue={quiz?.instructions}
              rows={3}
              placeholder="Lee cuidadosamente cada pregunta antes de responder..."
              className="border-slate-200 dark:border-slate-700 focus:ring-1 focus:ring-slate-300 dark:focus:ring-slate-600 resize-none"
            />
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 h-px" />

      {/* Configuración */}
      <div>
        <h3 className="text-sm font-semibold text-foreground tracking-tight mb-4">Configuración del Examen</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="status" className="text-xs font-medium uppercase tracking-wide">Estado *</Label>
            <Select name="status" defaultValue={quiz?.status || "DRAFT"}>
              <SelectTrigger className="border-slate-200 dark:border-slate-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DRAFT">Borrador</SelectItem>
                <SelectItem value="PUBLISHED">Publicado</SelectItem>
                <SelectItem value="ARCHIVED">Archivado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="passingScore" className="text-xs font-medium uppercase tracking-wide">Nota Mínima (%) *</Label>
            <Input
              id="passingScore"
              name="passingScore"
              type="number"
              min="0"
              max="100"
              defaultValue={quiz?.passingScore || 70}
              required
              className="border-slate-200 dark:border-slate-700 focus:ring-1 focus:ring-slate-300 dark:focus:ring-slate-600"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="maxAttempts" className="text-xs font-medium uppercase tracking-wide">Intentos Máximos</Label>
            <Input
              id="maxAttempts"
              name="maxAttempts"
              type="number"
              min="1"
              defaultValue={quiz?.maxAttempts}
              placeholder="Ilimitado"
              className="border-slate-200 dark:border-slate-700 focus:ring-1 focus:ring-slate-300 dark:focus:ring-slate-600"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="timeLimit" className="text-xs font-medium uppercase tracking-wide">Tiempo Límite (min)</Label>
            <Input
              id="timeLimit"
              name="timeLimit"
              type="number"
              min="1"
              defaultValue={quiz?.timeLimit}
              placeholder="Sin límite"
              className="border-slate-200 dark:border-slate-700 focus:ring-1 focus:ring-slate-300 dark:focus:ring-slate-600"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="questionsPerAttempt" className="text-xs font-medium uppercase tracking-wide">Preguntas/Intento</Label>
            <Input
              id="questionsPerAttempt"
              name="questionsPerAttempt"
              type="number"
              min="1"
              defaultValue={quiz?.questionsPerAttempt}
              placeholder="Todas"
              className="border-slate-200 dark:border-slate-700 focus:ring-1 focus:ring-slate-300 dark:focus:ring-slate-600"
            />
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 h-px" />

      {/* Opciones de aleatorización */}
      <div>
        <h3 className="text-sm font-semibold text-foreground tracking-tight mb-4">Opciones de Presentación</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-md bg-slate-50 dark:bg-slate-900/30 hover:bg-slate-100 dark:hover:bg-slate-900/50 transition-colors">
            <div className="space-y-0.5">
              <Label htmlFor="shuffleQuestions" className="text-sm font-medium">Barajar Preguntas</Label>
              <p className="text-xs text-muted-foreground">
                Mostrar preguntas en orden aleatorio
              </p>
            </div>
            <Switch
              id="shuffleQuestions"
              name="shuffleQuestions"
              defaultChecked={quiz?.shuffleQuestions}
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-md bg-slate-50 dark:bg-slate-900/30 hover:bg-slate-100 dark:hover:bg-slate-900/50 transition-colors">
            <div className="space-y-0.5">
              <Label htmlFor="shuffleOptions" className="text-sm font-medium">Barajar Opciones</Label>
              <p className="text-xs text-muted-foreground">
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
      </div>

      <div className="bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 h-px" />

      {/* Políticas de visualización */}
      <div>
        <h3 className="text-sm font-semibold text-foreground tracking-tight mb-4">Visualización de Resultados</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-md bg-slate-50 dark:bg-slate-900/30 hover:bg-slate-100 dark:hover:bg-slate-900/50 transition-colors">
            <div className="space-y-0.5">
              <Label htmlFor="showCorrectAnswers" className="text-sm font-medium">Mostrar Respuestas Correctas</Label>
              <p className="text-xs text-muted-foreground">
                Mostrar cuáles eran las respuestas correctas
              </p>
            </div>
            <Switch
              id="showCorrectAnswers"
              name="showCorrectAnswers"
              defaultChecked={quiz?.showCorrectAnswers ?? true}
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-md bg-slate-50 dark:bg-slate-900/30 hover:bg-slate-100 dark:hover:bg-slate-900/50 transition-colors">
            <div className="space-y-0.5">
              <Label htmlFor="showFeedback" className="text-sm font-medium">Mostrar Retroalimentación</Label>
              <p className="text-xs text-muted-foreground">
                Mostrar feedback por cada pregunta
              </p>
            </div>
            <Switch
              id="showFeedback"
              name="showFeedback"
              defaultChecked={quiz?.showFeedback ?? true}
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-md bg-slate-50 dark:bg-slate-900/30 hover:bg-slate-100 dark:hover:bg-slate-900/50 transition-colors">
            <div className="space-y-0.5">
              <Label htmlFor="showScoreImmediately" className="text-sm font-medium">Puntuación Inmediata</Label>
              <p className="text-xs text-muted-foreground">
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
      </div>

      <div className="bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 h-px" />

      {/* Selector de preguntas */}
      <div>
        <div className="mb-4 space-y-3">
          <div className="flex items-baseline justify-between">
            <h3 className="text-sm font-semibold text-foreground tracking-tight">
              Preguntas del Examen
            </h3>
            <span className="text-xs text-muted-foreground">
              {selectedQuestions.length} / {filteredQuestions.length}
            </span>
          </div>

          {/* Indicador visual de puntos */}
          <div className="bg-slate-50 dark:bg-slate-900/30 p-3 rounded-md space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Puntuación Total</span>
              <Badge 
                variant={totalPoints === targetPoints ? "default" : exceeds ? "destructive" : "secondary"}
                className="font-semibold"
              >
                {totalPoints} / {targetPoints}
              </Badge>
            </div>
            <Progress 
              value={Math.min(100, (totalPoints / targetPoints) * 100)} 
              className="h-1.5"
            />
            <p className="text-xs text-muted-foreground">
              {totalPoints === targetPoints
                ? "✓ Meta alcanzada: 20 puntos"
                : exceeds
                ? `⚠ Exceso: +${totalPoints - targetPoints} pts`
                : `• Restantes: ${remainingPoints} pts`}
            </p>
          </div>

          {/* Filtros de búsqueda */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Input
                placeholder="Buscar pregunta..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border-slate-200 dark:border-slate-700 focus:ring-1 focus:ring-slate-300 dark:focus:ring-slate-600"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-40 border-slate-200 dark:border-slate-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos</SelectItem>
                <SelectItem value="SINGLE_CHOICE">Opción Única</SelectItem>
                <SelectItem value="MULTIPLE_CHOICE">Múltiple</SelectItem>
                <SelectItem value="TRUE_FALSE">V/F</SelectItem>
                <SelectItem value="ORDER">Ordenar</SelectItem>
                <SelectItem value="FILL_BLANK">Completar</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Lista de preguntas */}
        <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden max-h-96 overflow-y-auto">
          {filteredQuestions.length === 0 ? (
            <p className="text-center text-muted-foreground py-12 text-sm">
              No hay preguntas disponibles
            </p>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-700">
              {filteredQuestions.map((question) => {
                const willExceed = !selectedQuestions.includes(question.id) && totalPoints + (question.points || 0) > targetPoints;
                const isSelected = selectedQuestions.includes(question.id);
                return (
                  <div
                    key={question.id}
                    className={`flex items-start gap-3 p-3 transition-colors ${
                      isSelected 
                        ? "bg-slate-100 dark:bg-slate-900/50" 
                        : "hover:bg-slate-50 dark:hover:bg-slate-900/20"
                    }`}
                  >
                    {/* Checkbox */}
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleQuestion(question.id)}
                      onClick={(e) => e.stopPropagation()}
                      aria-label="Seleccionar pregunta"
                      className="mt-0.5"
                    />
                    
                    {/* Contenido de la pregunta */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground leading-relaxed line-clamp-2">
                        {question.questionText}
                      </p>
                      
                      {/* Tags y metadata */}
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <Badge 
                          variant="outline" 
                          className="text-xs font-normal bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600"
                        >
                          {typeLabels[question.type]}
                        </Badge>
                        
                        {question.topic && (
                          <Badge 
                            variant="secondary" 
                            className="text-xs font-normal bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                          >
                            {question.topic}
                          </Badge>
                        )}
                        
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 ml-auto">
                          {question.points} pts
                        </span>
                        
                        {willExceed && (
                          <Badge 
                            variant="destructive" 
                            className="text-[10px] font-medium"
                          >
                            Excede 20
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {selectedQuestions.length === 0 && filteredQuestions.length > 0 && (
          <p className="text-xs text-amber-600 dark:text-amber-500 mt-2 flex items-center gap-1">
            ⚠ Selecciona al menos una pregunta
          </p>
        )}
      </div>

      {/* Pie de página */}
      <div className="flex items-center justify-between pt-6 border-t border-slate-200 dark:border-slate-700">
        <div className="text-xs text-slate-600 dark:text-slate-400">
          {exceeds
            ? `Has excedido por ${totalPoints - targetPoints} pts`
            : totalPoints === targetPoints
            ? "✓ Puntuación correcta"
            : `${remainingPoints} pts restantes`}
        </div>
        <Button 
          type="submit" 
          disabled={loading || selectedQuestions.length === 0}
          className="px-6 font-medium"
        >
          {loading ? "Guardando..." : quiz ? "Actualizar Examen" : "Crear Examen"}
        </Button>
      </div>
    </form>
  );
}
