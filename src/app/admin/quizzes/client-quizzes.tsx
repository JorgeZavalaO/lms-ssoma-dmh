"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Eye, Play } from "lucide-react";
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
import { QuizForm } from "./quiz-form";
import { QuizPreview } from "./quiz-preview";

type Quiz = {
  id: string;
  title: string;
  description?: string;
  status: string;
  passingScore: number;
  maxAttempts?: number;
  timeLimit?: number;
  quizQuestions: Array<{
    question: {
      id: string;
      questionText: string;
      type: string;
    };
  }>;
  _count: {
    attempts: number;
  };
};

const statusLabels: Record<string, { label: string; variant: any }> = {
  DRAFT: { label: "Borrador", variant: "secondary" },
  PUBLISHED: { label: "Publicado", variant: "default" },
  ARCHIVED: { label: "Archivado", variant: "outline" },
};

export function ClientQuizzes() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewQuiz, setPreviewQuiz] = useState<Quiz | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const fetchQuizzes = async () => {
    try {
      const res = await fetch("/api/quizzes");
      if (!res.ok) throw new Error("Error al cargar cuestionarios");
      const data = await res.json();
      setQuizzes(data);
    } catch (error) {
      toast.error("No se pudieron cargar los cuestionarios");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este cuestionario?")) return;

    try {
      const res = await fetch(`/api/quizzes/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error);
      }

      toast.success("Cuestionario eliminado correctamente");
      fetchQuizzes();
    } catch (error: any) {
      toast.error(error.message || "No se pudo eliminar el cuestionario");
    }
  };

  const handleSuccess = () => {
    setDialogOpen(false);
    setSelectedQuiz(null);
    fetchQuizzes();
  };

  const handlePreview = async (quiz: Quiz) => {
    try {
      const res = await fetch(`/api/quizzes/${quiz.id}`);
      if (!res.ok) throw new Error("Error al cargar cuestionario");
      const data = await res.json();
      setPreviewQuiz(data);
      setPreviewOpen(true);
    } catch (error) {
      toast.error("No se pudo cargar la vista previa");
    }
  };

  if (loading) {
    return <div className="p-8">Cargando cuestionarios...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Cuestionarios</h1>
          <p className="text-muted-foreground">
            Administra los cuestionarios de evaluación
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setSelectedQuiz(null)}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Cuestionario
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedQuiz ? "Editar Cuestionario" : "Nuevo Cuestionario"}
              </DialogTitle>
            </DialogHeader>
            <QuizForm quiz={selectedQuiz} onSuccess={handleSuccess} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Preguntas</TableHead>
              <TableHead>Nota Mínima</TableHead>
              <TableHead>Intentos</TableHead>
              <TableHead>Tiempo</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {quizzes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No hay cuestionarios registrados
                </TableCell>
              </TableRow>
            ) : (
              quizzes.map((quiz) => {
                const statusConfig = statusLabels[quiz.status] || statusLabels.DRAFT;
                return (
                  <TableRow key={quiz.id}>
                    <TableCell className="max-w-md">
                      <div className="font-medium">{quiz.title}</div>
                      {quiz.description && (
                        <div className="text-sm text-muted-foreground truncate">
                          {quiz.description}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusConfig.variant}>
                        {statusConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell>{quiz.quizQuestions.length}</TableCell>
                    <TableCell>{quiz.passingScore}%</TableCell>
                    <TableCell>
                      {quiz.maxAttempts || "Ilimitado"}
                      {quiz._count.attempts > 0 && (
                        <span className="text-xs text-muted-foreground ml-1">
                          ({quiz._count.attempts})
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {quiz.timeLimit ? `${quiz.timeLimit} min` : "Sin límite"}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePreview(quiz)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedQuiz(quiz);
                          setDialogOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(quiz.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Vista Previa: {previewQuiz?.title}</DialogTitle>
          </DialogHeader>
          {previewQuiz && <QuizPreview quiz={previewQuiz} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
