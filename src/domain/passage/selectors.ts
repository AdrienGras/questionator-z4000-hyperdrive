import type {
  NormalizedCategory,
  NormalizedConfig,
  NormalizedQuestion,
} from '@/domain/config/normalize'
import type { Attempt, Session, Student } from '@/domain/session/types'
import { studentStatus } from '@/domain/scoring/status'

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

/**
 * Prochain étudiant à faire passer : premier « todo » ou « en cours » après l'étudiant courant
 * dans l'ordre `order`, sinon reprise au début. Jamais l'étudiant courant lui-même.
 */
export function nextStudent(session: Session, currentId: string | undefined): string | null {
  const sorted = session.students.toSorted((a, b) => a.order - b.order)
  const candidates = sorted.filter((student) => {
    if (student.id === currentId) return false
    const status = studentStatus(student, session.config)
    return status === 'todo' || status === 'in_progress'
  })
  if (candidates.length === 0) return null
  const currentOrder = sorted.find((student) => student.id === currentId)?.order
  if (currentOrder === undefined) return candidates[0]!.id
  const after = candidates.find((student) => student.order > currentOrder)
  return (after ?? candidates[0]!).id
}

/** La popup d'ajustement s'ouvre d'elle-même quand la note finale n'a pas encore été révélée. */
export function shouldAutoOpenAdjustment(student: Student, config: NormalizedConfig): boolean {
  return studentStatus(student, config) === 'done' && student.finalRevealedAt === undefined
}
