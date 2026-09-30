import { describe, expect, test } from 'vitest'
import exampleText from '../../../examples/config.example.json?raw'
import { validateConfig } from '@/domain/config/validate'
import { computeStats } from '@/domain/stats/compute-stats'
import { makeSession } from '@/testing/session-fixtures'
import { attemptOf } from '@/testing/stats-fixtures'
import { makeStudent } from '@/testing/student-fixtures'
import { buildWorkbook } from './build-workbook'

function exampleSession() {
  const result = validateConfig(exampleText, { cssSupports: () => true })
  if (!result.ok) throw new Error('exemple invalide')
  const { config } = result
  const first = config.categories[0]
  if (!first) throw new Error('exemple sans catégories')
  const question = first.questions[0]?.id ?? ''
  const top = Math.max(...first.scale)
  const draws = (score: number) =>
    Array.from({ length: config.scoring.questionsPerStudent }, () =>
      attemptOf(first.id, question, score),
    )
  return makeSession({
    config,
    students: [
      makeStudent([], { id: 's1', order: 1, attempts: draws(top) }),
      makeStudent([], { id: 's2', order: 2, attempts: draws(top / 2) }),
      makeStudent([], { id: 's3', order: 3, absent: true }),
    ],
  })
}

describe('buildWorkbook', () => {
  const now = new Date('2026-09-30T10:00:00Z')

  test.each([
    ['fr', ['Synthèse', 'Détail des questions', 'Statistiques', 'Configuration', 'Métadonnées']],
    ['en', ['Summary', 'Question details', 'Statistics', 'Configuration', 'Metadata']],
  ] as const)('cinq onglets dans l’ordre (%s)', (locale, names) => {
    const session = exampleSession()
    const workbook = buildWorkbook(session, computeStats(session), locale, now)
    expect(workbook.map((sheet) => sheet.name)).toEqual(names)
  })

  test('les colonnes de note de la Synthèse sont des nombres ou vides', () => {
    const session = exampleSession()
    const summary = buildWorkbook(session, computeStats(session), 'fr', now)[0]
    if (!summary) throw new Error('Synthèse manquante')
    // L'absent exporté en mode « label » garde un texte : on ne contrôle que les terminés.
    const students = summary.rows.slice(1, 3)
    // Brute, Plafonnée, Convertie, Ajustement, Finale : colonnes 6 à 9 et 11.
    for (const row of students) {
      for (const index of [6, 7, 8, 9, 11]) {
        const cell = row[index]
        expect(cell === null || cell?.kind === 'number').toBe(true)
      }
    }
  })
})
