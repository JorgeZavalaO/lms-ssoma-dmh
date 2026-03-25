import { describe, expect, it } from "vitest"
import {
  buildAttemptDetailsForCollaborator,
  sanitizeAttemptForCollaborator,
  sanitizeQuizForCollaborator,
  secureShuffle,
} from "../../src/lib/quiz-security"

describe("quiz security helpers", () => {
  it("removes correctness metadata from collaborator quiz payloads", () => {
    const sanitized = sanitizeQuizForCollaborator({
      id: "quiz-1",
      title: "Quiz",
      showCorrectAnswers: true,
      quizQuestions: [
        {
          id: "qq-1",
          order: 1,
          points: 10,
          question: {
            id: "q-1",
            questionText: "Pregunta",
            type: "SINGLE_CHOICE",
            points: 10,
            options: [
              { id: "o-1", optionText: "A", isCorrect: true, order: 1 },
              { id: "o-2", optionText: "B", isCorrect: false, order: 2 },
            ],
          },
        },
      ],
    })

    expect(
      sanitized.quizQuestions?.[0]?.question.options?.[0]
    ).not.toHaveProperty("isCorrect")
    expect(
      sanitized.quizQuestions?.[0]?.question.options?.[1]
    ).not.toHaveProperty("isCorrect")
  })

  it("shuffles without losing or duplicating entries", () => {
    const original = ["a", "b", "c", "d", "e"]
    const shuffled = secureShuffle(original)

    expect(shuffled).toHaveLength(original.length)
    expect(new Set(shuffled)).toEqual(new Set(original))
    expect(shuffled).not.toBe(original)
  })

  it("only exposes post-grading details allowed by quiz policy", () => {
    const details = buildAttemptDetailsForCollaborator(
      {
        id: "quiz-1",
        title: "Quiz",
        showCorrectAnswers: false,
        showFeedback: true,
        quizQuestions: [
          {
            id: "qq-1",
            order: 1,
            points: 10,
            question: {
              id: "q-1",
              questionText: "Pregunta",
              type: "SINGLE_CHOICE",
              points: 10,
              options: [
                { id: "o-1", optionText: "A", isCorrect: true, order: 1 },
                { id: "o-2", optionText: "B", isCorrect: false, order: 2 },
              ],
            },
          },
        ],
      },
      {
        "q-1": {
          isCorrect: false,
          userAnswer: "o-2",
          points: 0,
          feedback: "Retroalimentacion",
          explanation: "Explicacion",
        },
      }
    )

    expect(details).toHaveLength(1)
    expect(details[0]).toMatchObject({
      isCorrect: false,
      feedback: "Retroalimentacion",
      explanation: "Explicacion",
    })
    expect(details[0]).not.toHaveProperty("correctAnswer")
  })

  it("sanitizes persisted attempts for collaborators", () => {
    const sanitized = sanitizeAttemptForCollaborator({
      id: "attempt-1",
      quizId: "quiz-1",
      status: "FAILED",
      score: 45,
      quiz: {
        id: "quiz-1",
        title: "Quiz",
        quizQuestions: [
          {
            id: "qq-1",
            question: {
              id: "q-1",
              questionText: "Pregunta",
              type: "SINGLE_CHOICE",
              points: 10,
              options: [{ id: "o-1", optionText: "A", isCorrect: true, order: 1 }],
            },
          },
        ],
      },
    })

    expect(
      sanitized.quiz?.quizQuestions?.[0]?.question.options?.[0]
    ).not.toHaveProperty("isCorrect")
  })
})
