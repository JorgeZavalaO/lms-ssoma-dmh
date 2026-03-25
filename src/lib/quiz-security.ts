import { randomInt } from "crypto"

type QuizOption = {
  id: string
  optionText: string
  order?: number | null
}

type QuizQuestion = {
  id: string
  questionText: string
  type: string
  points: number
  options?: Array<
    QuizOption & {
      isCorrect?: boolean
    }
  >
}

type QuizQuestionLink = {
  id?: string
  order?: number | null
  points?: number | null
  question: QuizQuestion
}

type QuizShape = {
  id: string
  title: string
  description?: string | null
  instructions?: string | null
  passingScore?: number
  maxAttempts?: number | null
  timeLimit?: number | null
  shuffleQuestions?: boolean
  shuffleOptions?: boolean
  showCorrectAnswers?: boolean
  showFeedback?: boolean
  showScoreImmediately?: boolean
  quizQuestions?: QuizQuestionLink[]
}

export function sanitizeQuizQuestionForCollaborator(
  quizQuestion: QuizQuestionLink
) {
  return {
    id: quizQuestion.id,
    order: quizQuestion.order,
    points: quizQuestion.points,
    question: {
      id: quizQuestion.question.id,
      questionText: quizQuestion.question.questionText,
      type: quizQuestion.question.type,
      points: quizQuestion.question.points,
      options: (quizQuestion.question.options || []).map((option) => ({
        id: option.id,
        optionText: option.optionText,
        order: option.order,
      })),
    },
  }
}

export function sanitizeQuizForCollaborator<T extends QuizShape>(quiz: T) {
  return {
    ...quiz,
    quizQuestions: (quiz.quizQuestions || []).map(
      sanitizeQuizQuestionForCollaborator
    ),
  }
}

type AttemptShape = {
  id: string
  quizId?: string
  collaboratorId?: string
  attemptNumber?: number
  status: string
  score?: number | null
  pointsEarned?: number | null
  pointsTotal?: number | null
  startedAt?: Date | string | null
  submittedAt?: Date | string | null
  timeSpent?: number | null
  requiresRemediation?: boolean | null
  remediationCompleted?: boolean | null
  answers?: unknown
  quiz?: QuizShape
}

type AttemptQuestionResult = {
  isCorrect: boolean
  userAnswer: unknown
  points: number
  feedback?: string | null
  explanation?: string | null
}

function formatCorrectAnswer(
  question: QuizQuestion & {
    options?: Array<QuizOption & { isCorrect?: boolean }>
  }
) {
  const correctOptions = (question.options || []).filter((option) => option.isCorrect)
  if (correctOptions.length === 0) return null

  if (question.type === "ORDER") {
    return [...correctOptions]
      .sort((left, right) => (left.order || 0) - (right.order || 0))
      .map((option) => option.optionText)
      .join(" -> ")
  }

  return correctOptions.map((option) => option.optionText).join(", ")
}

export function buildAttemptDetailsForCollaborator(
  quiz: QuizShape,
  results: Record<string, AttemptQuestionResult>
) {
  const canShowCorrectAnswers = Boolean(quiz.showCorrectAnswers)
  const canShowFeedback = Boolean(quiz.showFeedback)

  if (!canShowCorrectAnswers && !canShowFeedback) {
    return []
  }

  return (quiz.quizQuestions || []).map((quizQuestion, index) => {
    const result = results[quizQuestion.question.id]
    const detail: Record<string, unknown> = {
      questionId: quizQuestion.question.id,
      questionNumber: index + 1,
      questionText: quizQuestion.question.questionText,
      earnedPoints: result?.points ?? 0,
      maxPoints: quizQuestion.points || quizQuestion.question.points,
    }

    if (canShowCorrectAnswers || canShowFeedback) {
      detail.isCorrect = Boolean(result?.isCorrect)
    }

    if (canShowCorrectAnswers) {
      detail.correctAnswer = formatCorrectAnswer(quizQuestion.question)
    }

    if (canShowFeedback) {
      detail.feedback = result?.feedback ?? null
      detail.explanation = result?.explanation ?? null
    }

    return detail
  })
}

export function sanitizeAttemptForCollaborator<T extends AttemptShape>(
  attempt: T
) {
  return {
    id: attempt.id,
    quizId: attempt.quizId,
    collaboratorId: attempt.collaboratorId,
    attemptNumber: attempt.attemptNumber,
    status: attempt.status,
    score: attempt.score,
    pointsEarned: attempt.pointsEarned,
    pointsTotal: attempt.pointsTotal,
    startedAt: attempt.startedAt,
    submittedAt: attempt.submittedAt,
    timeSpent: attempt.timeSpent,
    requiresRemediation: attempt.requiresRemediation,
    remediationCompleted: attempt.remediationCompleted,
    answers: attempt.answers,
    quiz: attempt.quiz ? sanitizeQuizForCollaborator(attempt.quiz) : undefined,
  }
}

export function secureShuffle<T>(items: T[]) {
  const result = [...items]

  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(index + 1)
    ;[result[index], result[swapIndex]] = [result[swapIndex], result[index]]
  }

  return result
}
