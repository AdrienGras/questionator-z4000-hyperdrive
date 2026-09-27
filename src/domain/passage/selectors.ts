import type {
  NormalizedCategory,
  NormalizedConfig,
  NormalizedQuestion,
} from '@/domain/config/normalize'
import type { Attempt, Student } from '@/domain/session/types'

/** Questions de la catégorie non encore tirées par cet étudiant (tout `outcome` confondu). */
export function availableQuestions(
  student: Student,
  category: NormalizedCategory,
): NormalizedQuestion[] {
  const drawn = new Set(
    student.attempts
      .filter((attempt) => attempt.categoryId === category.id)
      .map((attempt) => attempt.questionId),
  )
  return category.questions.filter((question) => !drawn.has(question.id))
}

export function isCategoryExhausted(student: Student, category: NormalizedCategory): boolean {
  return availableQuestions(student, category).length === 0
}

/** L'attempt en cours de passage, s'il y en a un. */
export function currentPending(student: Student): Attempt | undefined {
  return student.attempts.find((attempt) => attempt.outcome === 'pending')
}

/** Position 1-based de la question en cours sur le total prévu (§7). */
export function questionIndex(
  student: Student,
  config: NormalizedConfig,
): { current: number; total: number } {
  const total = config.scoring.questionsPerStudent
  const scored = student.attempts.filter((attempt) => attempt.outcome === 'scored').length
  return { current: Math.min(scored + 1, total), total }
}
