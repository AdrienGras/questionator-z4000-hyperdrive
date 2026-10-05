import { describe, expect, test } from 'vitest'
import exampleText from '../../../examples/training.example.json?raw'
import { validateConfig } from '@/domain/config/validate'
import { TRAINING_CATEGORIES } from '@/domain/training/training-categories'

const result = validateConfig(exampleText, { cssSupports: () => true })
if (!result.ok)
  throw new Error(`exemple d’entraînement invalide : ${JSON.stringify(result.issues)}`)
const categories = result.config.categories

describe('config d’exemple d’entraînement', () => {
  test('passe validateConfig sans erreur ni avertissement', () => {
    expect(result.issues).toEqual([])
    expect(result.ok).toBe(true)
  })

  test('catégories identiques aux catégories imposées', () => {
    expect(categories.map((c) => [c.id, c.label, c.scale, c.icon])).toEqual(
      TRAINING_CATEGORIES.map((c) => [c.id, c.label.fr, c.scale, c.icon]),
    )
  })

  test('id de question au format <niveau>-<slug>', () => {
    for (const category of categories) {
      for (const question of category.questions) {
        expect(question.id).toMatch(/^(facile|normal|difficile|cauchemar)-[a-z0-9]+(-[a-z0-9]+)*$/)
        expect(question.id.startsWith(`${category.id}-`)).toBe(true)
      }
    }
  })

  test('answer suit le gabarit, une ligne par valeur non nulle du barème', () => {
    for (const category of categories) {
      const attendues = category.scale
        .filter((v) => v !== 0)
        .map((v) => String(v).replace('.', ','))
      for (const question of category.questions) {
        expect(question.answer).toContain('**Réponse de référence**')
        expect(question.answer).toContain('**Barème**')
        const valeurs = [...(question.answer ?? '').matchAll(/^- \*\*([0-9,]+)\*\* :/gm)].map(
          (m) => m[1],
        )
        expect(valeurs).toEqual(attendues)
      }
    }
  })

  test('difficile : au moins 2 tags ; chaque tag a une question facile et une normal', () => {
    const questionsDe = (id: string) => categories.find((c) => c.id === id)?.questions ?? []
    for (const question of questionsDe('difficile')) {
      expect(question.tags?.length ?? 0).toBeGreaterThanOrEqual(2)
    }
    const tags = new Set(categories.flatMap((c) => c.questions.flatMap((q) => q.tags ?? [])))
    for (const tag of tags) {
      expect(questionsDe('facile').some((q) => q.tags?.includes(tag))).toBe(true)
      expect(questionsDe('normal').some((q) => q.tags?.includes(tag))).toBe(true)
    }
  })

  test('facile : exactement 1 tag par question', () => {
    const facile = categories.find((c) => c.id === 'facile')
    for (const question of facile?.questions ?? []) {
      expect(question.tags?.length).toBe(1)
    }
  })

  test('barème : chaque ligne décrit la réponse complète, sans formule incrémentale', () => {
    for (const category of categories) {
      for (const question of category.questions) {
        const lignes = (question.answer ?? '')
          .split('\n')
          .filter((l) => /^- \*\*[0-9,]+\*\* :/.test(l))
        for (const ligne of lignes) {
          expect(ligne).not.toMatch(/en plus|précédente|plus haut/i)
        }
      }
    }
  })
})
