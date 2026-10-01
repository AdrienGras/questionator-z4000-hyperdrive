import { describe, expect, test } from 'vitest'
import exampleText from '../../../examples/config.example.json?raw'
import { validateConfig } from '@/domain/config/validate'
import { toProjectedView } from './projected-view'
import { previewSession } from './preview-session'

const result = validateConfig(exampleText, { cssSupports: () => true })
if (!result.ok) throw new Error('exemple invalide')
const config = result.config
const NOW = new Date('2026-10-01T10:00:00.000Z')

describe('previewSession', () => {
  const session = previewSession(config, NOW)
  const [student] = session.students

  test('un étudiant Ada Lovelace, projeté et actif', () => {
    expect(session.id).toBe('preview')
    expect(session.name).toBe(config.exam.title)
    expect(session.students).toHaveLength(1)
    expect(student?.firstName).toBe('Ada')
    expect(student?.lastName).toBe('Lovelace')
    expect(session.projection).toEqual({ mode: 'student', studentId: student?.id })
    expect(session.activeStudentId).toBe(student?.id)
    expect(student?.finalRevealedAt).toBeDefined()
  })

  test('questionsPerStudent passages notés à la valeur médiane du barème', () => {
    expect(student?.attempts).toHaveLength(config.scoring.questionsPerStudent)
    for (const attempt of student?.attempts ?? []) {
      const category = config.categories.find((c) => c.id === attempt.categoryId)
      const sorted = (category?.scale ?? []).toSorted((a, b) => a - b)
      expect(attempt.outcome).toBe('scored')
      expect(attempt.score).toBe(sorted[Math.floor(sorted.length / 2)])
      expect(category?.questions.some((q) => q.id === attempt.questionId)).toBe(true)
    }
    expect(student?.attempts.map((a) => a.id)).toEqual(
      student?.attempts.map((_, i) => `preview-${i + 1}`),
    )
  })

  test('la vue projetée affiche l’écran final', () => {
    const view = toProjectedView(session)
    expect(view.mode).toBe('student')
    if (view.mode !== 'student') throw new Error('mode attendu : student')
    expect(view.final).toBeDefined()
  })
})
