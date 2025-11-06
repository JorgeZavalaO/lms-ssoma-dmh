import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

// Estilos para el PDF
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    paddingBottom: 15,
    borderBottom: '2 solid #333',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  infoGrid: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 20,
  },
  infoItem: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 9,
    color: '#999',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#333',
  },
  scoreBox: {
    backgroundColor: '#f0f9ff',
    padding: 12,
    borderRadius: 4,
    marginTop: 15,
    marginBottom: 20,
    border: '1 solid #3b82f6',
  },
  scoreText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e40af',
    textAlign: 'center',
  },
  statusPass: {
    backgroundColor: '#dcfce7',
    border: '1 solid #16a34a',
  },
  statusFail: {
    backgroundColor: '#fee2e2',
    border: '1 solid #dc2626',
  },
  questionContainer: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f9fafb',
    borderRadius: 4,
    border: '1 solid #e5e7eb',
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  questionNumber: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#6b7280',
  },
  questionPoints: {
    fontSize: 9,
    color: '#6b7280',
  },
  questionText: {
    fontSize: 11,
    lineHeight: 1.5,
    marginBottom: 12,
    color: '#1f2937',
  },
  optionContainer: {
    marginBottom: 8,
    padding: 8,
    backgroundColor: '#ffffff',
    borderRadius: 3,
    border: '1 solid #e5e7eb',
  },
  optionSelected: {
    backgroundColor: '#dbeafe',
    border: '1 solid #3b82f6',
  },
  optionCorrect: {
    backgroundColor: '#dcfce7',
    border: '1 solid #16a34a',
  },
  optionIncorrect: {
    backgroundColor: '#fee2e2',
    border: '1 solid #dc2626',
  },
  optionText: {
    fontSize: 10,
    color: '#374151',
  },
  optionLabel: {
    fontSize: 8,
    color: '#9ca3af',
    marginTop: 4,
  },
  resultBadge: {
    fontSize: 9,
    fontWeight: 'bold',
    marginTop: 8,
    padding: 4,
    borderRadius: 2,
  },
  correct: {
    color: '#16a34a',
    backgroundColor: '#dcfce7',
  },
  incorrect: {
    color: '#dc2626',
    backgroundColor: '#fee2e2',
  },
  feedback: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#fffbeb',
    borderRadius: 3,
    border: '1 solid #fbbf24',
  },
  feedbackText: {
    fontSize: 9,
    color: '#92400e',
    lineHeight: 1.4,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#9ca3af',
    borderTop: '1 solid #e5e7eb',
    paddingTop: 10,
  },
  pageNumber: {
    fontSize: 8,
    color: '#9ca3af',
  },
})

interface QuizAttemptData {
  id: string
  attemptNumber: number
  score: number | null
  pointsEarned: number | null
  pointsTotal: number | null
  status: string
  startedAt: Date
  submittedAt: Date | null
  timeSpent: number | null
  answers: any
  quiz: {
    title: string
    description: string | null
    passingScore: number
    course: {
      name: string
      code: string | null
    } | null
  }
  collaborator: {
    fullName: string
    dni: string
    email: string
  }
  questions: Array<{
    id: string
    questionText: string
    type: string
    points: number
    options: Array<{
      id: string
      optionText: string
      isCorrect: boolean
      order: number
    }>
    correctFeedback: string | null
    incorrectFeedback: string | null
    explanation: string | null
  }>
  results: any
}

export const QuizAttemptPDF = ({ data }: { data: QuizAttemptData }) => {
  const isPassed = data.score !== null && data.score >= data.quiz.passingScore
  const statusColor = isPassed ? styles.statusPass : styles.statusFail

  const getQuestionResult = (questionId: string) => {
    if (!data.results || !data.results[questionId]) return null
    return data.results[questionId]
  }

  const getUserAnswer = (questionId: string) => {
    if (!data.answers || !data.answers[questionId]) return null
    return data.answers[questionId]
  }

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'N/A'
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`
    }
    if (minutes > 0) {
      return `${minutes}m ${secs}s`
    }
    return `${secs}s`
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Reporte de Evaluación</Text>
          <Text style={styles.subtitle}>{data.quiz.title}</Text>
          {data.quiz.course && (
            <Text style={styles.subtitle}>
              {data.quiz.course.code ? `[${data.quiz.course.code}] ` : ''}{data.quiz.course.name}
            </Text>
          )}
        </View>

        {/* Información del colaborador */}
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Colaborador</Text>
            <Text style={styles.infoValue}>{data.collaborator.fullName}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>DNI</Text>
            <Text style={styles.infoValue}>{data.collaborator.dni}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{data.collaborator.email}</Text>
          </View>
        </View>

        {/* Información del intento */}
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Intento #</Text>
            <Text style={styles.infoValue}>{data.attemptNumber}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Fecha</Text>
            <Text style={styles.infoValue}>
              {data.submittedAt
                ? format(new Date(data.submittedAt), "d 'de' MMMM, yyyy HH:mm", { locale: es })
                : 'En progreso'}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Tiempo empleado</Text>
            <Text style={styles.infoValue}>{formatDuration(data.timeSpent)}</Text>
          </View>
        </View>

        {/* Puntuación */}
        <View style={[styles.scoreBox, statusColor]}>
          <Text style={styles.scoreText}>
            Puntuación: {data.score?.toFixed(1)}% ({data.pointsEarned}/{data.pointsTotal} puntos)
          </Text>
          <Text style={[styles.scoreText, { fontSize: 11, marginTop: 4 }]}>
            {isPassed ? '✓ APROBADO' : '✗ DESAPROBADO'} (Mínimo: {data.quiz.passingScore}%)
          </Text>
        </View>

        {/* Preguntas y respuestas */}
        {data.questions.map((question, index) => {
          const userAnswer = getUserAnswer(question.id)
          const result = getQuestionResult(question.id)
          const isCorrect = result?.isCorrect

          return (
            <View key={question.id} style={styles.questionContainer} wrap={false}>
              <View style={styles.questionHeader}>
                <Text style={styles.questionNumber}>Pregunta {index + 1}</Text>
                <Text style={styles.questionPoints}>{question.points} punto(s)</Text>
              </View>

              <Text style={styles.questionText}>{question.questionText}</Text>

              {/* Opciones */}
              {question.options.map((option) => {
                const isUserAnswer = question.type === 'MULTIPLE_CHOICE'
                  ? Array.isArray(userAnswer) && userAnswer.includes(option.id)
                  : userAnswer === option.id

                let optionStyle = styles.optionContainer
                
                if (isUserAnswer && option.isCorrect) {
                  optionStyle = { ...styles.optionContainer, ...styles.optionCorrect }
                } else if (isUserAnswer && !option.isCorrect) {
                  optionStyle = { ...styles.optionContainer, ...styles.optionIncorrect }
                } else if (option.isCorrect) {
                  optionStyle = { ...styles.optionContainer, ...styles.optionCorrect }
                } else if (isUserAnswer) {
                  optionStyle = { ...styles.optionContainer, ...styles.optionSelected }
                }

                return (
                  <View key={option.id} style={optionStyle}>
                    <Text style={styles.optionText}>{option.optionText}</Text>
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                      {isUserAnswer && (
                        <Text style={styles.optionLabel}>• Respuesta seleccionada</Text>
                      )}
                      {option.isCorrect && (
                        <Text style={[styles.optionLabel, { color: '#16a34a' }]}>
                          • Respuesta correcta
                        </Text>
                      )}
                    </View>
                  </View>
                )
              })}

              {/* Resultado de la pregunta */}
              {result && (
                <View style={[styles.resultBadge, isCorrect ? styles.correct : styles.incorrect]}>
                  <Text>
                    {isCorrect ? '✓ Correcto' : '✗ Incorrecto'} - {result.pointsEarned || 0}/{question.points} puntos
                  </Text>
                </View>
              )}

              {/* Feedback */}
              {data.status === 'GRADED' && (
                <>
                  {isCorrect && question.correctFeedback && (
                    <View style={styles.feedback}>
                      <Text style={[styles.feedbackText, { fontWeight: 'bold', marginBottom: 4 }]}>
                        Retroalimentación:
                      </Text>
                      <Text style={styles.feedbackText}>{question.correctFeedback}</Text>
                    </View>
                  )}
                  {!isCorrect && question.incorrectFeedback && (
                    <View style={styles.feedback}>
                      <Text style={[styles.feedbackText, { fontWeight: 'bold', marginBottom: 4 }]}>
                        Retroalimentación:
                      </Text>
                      <Text style={styles.feedbackText}>{question.incorrectFeedback}</Text>
                    </View>
                  )}
                  {question.explanation && (
                    <View style={[styles.feedback, { backgroundColor: '#f0f9ff', border: '1 solid #3b82f6' }]}>
                      <Text style={[styles.feedbackText, { fontWeight: 'bold', marginBottom: 4, color: '#1e40af' }]}>
                        Explicación:
                      </Text>
                      <Text style={[styles.feedbackText, { color: '#1e40af' }]}>{question.explanation}</Text>
                    </View>
                  )}
                </>
              )}
            </View>
          )
        })}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>
            LMS SSOMA - Reporte generado el {format(new Date(), "d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}
          </Text>
          <Text
            style={styles.pageNumber}
            render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  )
}
