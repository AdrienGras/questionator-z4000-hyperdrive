import type { Session } from '@/domain/session/types'
import { studentStatus } from '@/domain/scoring/status'
import { PassageError } from './errors'
import { pickUniform } from './random'
import { availableQuestions, currentPending, isCategoryExhausted } from './selectors'

export type DrawDeps = { random: (n: number) => number; newId: () => string; now: () => Date }

/**
 * Tire une question dans une catégorie pour un étudiant (§7). Ordre des refus : l'étudiant
 * d'abord (introuvable, absent, passage terminé, question déjà en cours), la catégorie ensuite
 * (introuvable, épuisée) — voir docs/superpowers/specs/2026-09-27-f09-passage-design.md §7.
 */
export function drawQuestion(
  session: Session,
  input: { studentId: string; categoryId: string },
  deps: DrawDeps,
): Session {
  const student = session.students.find((s) => s.id === input.studentId)
  if (student === undefined) throw new PassageError('student_not_found')
  if (student.absent) throw new PassageError('student_absent')
  if (studentStatus(student, session.config) === 'done') throw new PassageError('student_done')
  if (currentPending(student) !== undefined) throw new PassageError('pending_exists')

  const category = session.config.categories.find((c) => c.id === input.categoryId)
  if (category === undefined) throw new PassageError('category_not_found')
  if (isCategoryExhausted(student, category)) throw new PassageError('category_exhausted')

  const question = pickUniform(availableQuestions(student, category), deps.random)
  const attempt = {
    id: deps.newId(),
    categoryId: category.id,
    questionId: question.id,
    drawnAt: deps.now().toISOString(),
    outcome: 'pending' as const,
  }

  return {
    ...session,
    students: session.students.map((s) =>
      s.id === student.id ? { ...s, attempts: [...s.attempts, attempt] } : s,
    ),
  }
}
