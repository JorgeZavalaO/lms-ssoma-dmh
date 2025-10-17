import { z } from "zod";

// Enums
export const QuestionTypeSchema = z.enum([
  "SINGLE_CHOICE",
  "MULTIPLE_CHOICE",
  "TRUE_FALSE",
  "ORDER",
  "FILL_BLANK",
]);

export const QuizStatusSchema = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);

export const AttemptStatusSchema = z.enum([
  "IN_PROGRESS",
  "SUBMITTED",
  "GRADED",
  "PASSED",
  "FAILED",
]);

// F1 - Banco de preguntas
export const QuestionOptionSchema = z.object({
  id: z.string().optional(),
  optionText: z.string().min(1, "El texto de la opción es requerido"),
  isCorrect: z.boolean().default(false),
  order: z.number().int().min(1),
});

export const CreateQuestionSchema = z.object({
  questionText: z.string().min(10, "La pregunta debe tener al menos 10 caracteres"),
  type: QuestionTypeSchema,
  points: z.number().int().min(1).default(1),
  topic: z.string().optional(),
  difficulty: z.number().int().min(1).max(10).default(5),
  correctFeedback: z.string().optional(),
  incorrectFeedback: z.string().optional(),
  explanation: z.string().optional(),
  courseVersionId: z.string().optional(),
  options: z.array(QuestionOptionSchema).min(1, "Debe haber al menos una opción"),
}).refine(
  (data) => {
    // Validaciones específicas por tipo de pregunta
    if (data.type === "TRUE_FALSE") {
      // TRUE_FALSE debe tener exactamente 2 opciones
      return data.options.length === 2;
    }
    if (data.type === "SINGLE_CHOICE" || data.type === "MULTIPLE_CHOICE") {
      // Debe haber al menos 2 opciones
      return data.options.length >= 2;
    }
    return true;
  },
  {
    message: "Número de opciones inválido para el tipo de pregunta",
    path: ["options"],
  }
).refine(
  (data) => {
    // Verificar que hay al menos una respuesta correcta
    const correctCount = data.options.filter((opt) => opt.isCorrect).length;
    
    if (data.type === "SINGLE_CHOICE" || data.type === "TRUE_FALSE") {
      return correctCount === 1;
    }
    if (data.type === "MULTIPLE_CHOICE") {
      return correctCount >= 1;
    }
    return true;
  },
  {
    message: "Debe haber el número correcto de respuestas marcadas como correctas",
    path: ["options"],
  }
);

export const UpdateQuestionSchema = CreateQuestionSchema.partial();

// F2 - Cuestionarios
export const CreateQuizSchema = z.object({
  title: z.string().min(3, "El título debe tener al menos 3 caracteres"),
  description: z.string().optional(),
  instructions: z.string().optional(),
  courseId: z.string().optional(),
  unitId: z.string().optional(),
  passingScore: z.number().int().min(0).max(100).default(70),
  maxAttempts: z.number().int().min(1).optional(),
  timeLimit: z.number().int().min(1).optional(), // en minutos
  shuffleQuestions: z.boolean().default(false),
  shuffleOptions: z.boolean().default(false),
  questionsPerAttempt: z.number().int().min(1).optional(),
  showCorrectAnswers: z.boolean().default(true),
  showFeedback: z.boolean().default(true),
  showScoreImmediately: z.boolean().default(true),
  status: QuizStatusSchema.default("DRAFT"),
  questionIds: z.array(z.string()).min(1, "Debe agregar al menos una pregunta"),
});

export const UpdateQuizSchema = CreateQuizSchema.partial();

// Agregar/quitar preguntas de un quiz
export const AddQuestionsToQuizSchema = z.object({
  questionIds: z.array(z.string()).min(1),
});

export const RemoveQuestionFromQuizSchema = z.object({
  questionId: z.string(),
});

// F3 - Intentos
export const StartQuizAttemptSchema = z.object({
  quizId: z.string(),
});

export const SubmitQuizAnswerSchema = z.object({
  attemptId: z.string(),
  questionId: z.string(),
  answer: z.union([
    z.string(), // Para SINGLE_CHOICE, TRUE_FALSE, FILL_BLANK
    z.array(z.string()), // Para MULTIPLE_CHOICE, ORDER
  ]),
});

export const SubmitQuizAttemptSchema = z.object({
  attemptId: z.string(),
  answers: z.record(
    z.string(), // questionId
    z.union([
      z.string(),
      z.array(z.string()),
    ])
  ),
});

// F3 - Remediación
export const CompleteRemediationSchema = z.object({
  attemptId: z.string(),
  remediationContent: z.string().optional(),
});

// Types derivados
export type QuestionType = z.infer<typeof QuestionTypeSchema>;
export type QuizStatus = z.infer<typeof QuizStatusSchema>;
export type AttemptStatus = z.infer<typeof AttemptStatusSchema>;
export type QuestionOption = z.infer<typeof QuestionOptionSchema>;
export type CreateQuestionInput = z.infer<typeof CreateQuestionSchema>;
export type UpdateQuestionInput = z.infer<typeof UpdateQuestionSchema>;
export type CreateQuizInput = z.infer<typeof CreateQuizSchema>;
export type UpdateQuizInput = z.infer<typeof UpdateQuizSchema>;
export type StartQuizAttemptInput = z.infer<typeof StartQuizAttemptSchema>;
export type SubmitQuizAnswerInput = z.infer<typeof SubmitQuizAnswerSchema>;
export type SubmitQuizAttemptInput = z.infer<typeof SubmitQuizAttemptSchema>;
export type CompleteRemediationInput = z.infer<typeof CompleteRemediationSchema>;
