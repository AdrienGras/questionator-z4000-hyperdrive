import type { NormalizedConfig } from '@/domain/config/normalize'
import { APP_VERSION } from '@/lib/app-version'
import type { Attempt, Session } from '@/domain/session/types'

const STUDENT_ID = 'preview-student'
const MS_PER_MINUTE = 60_000

/** Valeur du milieu du barème trié croissant. */
function middleScore(scale: readonly number[]): number {
  const sorted = scale.toSorted((a, b) => a - b)
  return sorted[Math.floor(sorted.length / 2)] ?? 0
}

/**
 * Session factice terminée (F26) pour rendre l'écran final dans l'aperçu de l'éditeur : un
 * étudiant projeté dont les `questionsPerStudent` passages sont notés à la valeur médiane du
 * barème. Catégories et questions parcourues dans l'ordre (en boucle si besoin). Pure, sans
 * aléa : ids déterministes, dates dérivées de `now`.
 */
export function previewSession(config: NormalizedConfig, now: Date = new Date()): Session {
  const total = config.scoring.questionsPerStudent
  const categories = config.categories.filter((category) => category.questions.length > 0)
  const attempts: Attempt[] = []
  for (let n = 0; n < total && categories.length > 0; n++) {
    const category = categories[n % categories.length]
    const question =
      category?.questions[Math.floor(n / categories.length) % category.questions.length]
    if (category === undefined || question === undefined) break
    attempts.push({
      id: `preview-${n + 1}`,
      categoryId: category.id,
      questionId: question.id,
      drawnAt: new Date(now.getTime() + n * MS_PER_MINUTE).toISOString(),
      outcome: 'scored',
      score: middleScore(category.scale),
    })
  }
  const timestamp = now.toISOString()
  return {
    id: 'preview',
    name: config.exam.title,
    createdAt: timestamp,
    updatedAt: timestamp,
    appVersion: APP_VERSION,
    config,
    students: [
      {
        id: STUDENT_ID,
        firstName: 'Ada',
        lastName: 'Lovelace',
        order: 1,
        addedDuringSession: false,
        absent: false,
        attempts,
        finalRevealedAt: new Date(now.getTime() + total * MS_PER_MINUTE).toISOString(),
      },
    ],
    activeStudentId: STUDENT_ID,
    projection: { mode: 'student', studentId: STUDENT_ID },
  }
}
