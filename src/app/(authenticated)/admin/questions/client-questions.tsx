"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { QuestionForm } from "./question-form";

type Question = {
  id: string;
  questionText: string;
  type: string;
  points: number;
  topic?: string;
  difficulty?: number;
  options: Array<{
    id?: string;
    optionText: string;
    isCorrect: boolean;
    order: number;
  }>;
};

const typeLabels: Record<string, string> = {
  SINGLE_CHOICE: "Opción Única",
  MULTIPLE_CHOICE: "Opción Múltiple",
  TRUE_FALSE: "Verdadero/Falso",
  ORDER: "Ordenar",
  FILL_BLANK: "Completar",
};

export function ClientQuestions() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchQuestions = async () => {
    try {
      const res = await fetch("/api/questions");
      if (!res.ok) throw new Error("Error al cargar preguntas");
      const data = await res.json();
      setQuestions(data);
    } catch (error) {
      toast.error("No se pudieron cargar las preguntas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar esta pregunta?")) return;

    try {
      const res = await fetch(`/api/questions/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error);
      }

      toast.success("Pregunta eliminada correctamente");
      fetchQuestions();
    } catch (error: any) {
      toast.error(error.message || "No se pudo eliminar la pregunta");
    }
  };

  const handleSuccess = () => {
    setDialogOpen(false);
    setSelectedQuestion(null);
    fetchQuestions();
  };

  if (loading) {
    return <div className="p-8">Cargando preguntas...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Banco de Preguntas</h1>
          <p className="text-muted-foreground">
            Administra las preguntas para los cuestionarios
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setSelectedQuestion(null)}>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Pregunta
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedQuestion ? "Editar Pregunta" : "Nueva Pregunta"}
              </DialogTitle>
            </DialogHeader>
            <QuestionForm
              question={selectedQuestion}
              onSuccess={handleSuccess}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pregunta</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Tema</TableHead>
              <TableHead>Puntos</TableHead>
              <TableHead>Dificultad</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {questions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No hay preguntas registradas
                </TableCell>
              </TableRow>
            ) : (
              questions.map((question) => (
                <TableRow key={question.id}>
                  <TableCell className="max-w-md">
                    <div className="truncate">{question.questionText}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {typeLabels[question.type]}
                    </Badge>
                  </TableCell>
                  <TableCell>{question.topic || "-"}</TableCell>
                  <TableCell>{question.points}</TableCell>
                  <TableCell>
                    {question.difficulty ? `${question.difficulty}/10` : "-"}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedQuestion(question);
                        setDialogOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(question.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
