import { describe, expect, test } from 'vitest'
import { CONFIG_SCHEMA_LITE_URL, CONFIG_SCHEMA_URL } from '@/domain/config/json-schema'
import { t, type Locale } from '@/lib/i18n/i18n'
import { TRAINING_MESSAGES } from './messages'
import { buildTrainingPrompt } from './prompt'
import { README_RAW_URL, TRAINING_CATEGORIES } from './training-categories'

const LOCALES: Locale[] = ['fr', 'en']

describe('buildTrainingPrompt', () => {
  test.each(LOCALES)(
    '%s : contient les URL du README, du schéma allégé et du schéma complet',
    (locale) => {
      const prompt = buildTrainingPrompt(locale)
      expect(prompt).toContain(README_RAW_URL)
      expect(prompt).toContain(CONFIG_SCHEMA_LITE_URL)
      expect(prompt).toContain(CONFIG_SCHEMA_URL)
    },
  )

  test.each(LOCALES)(
    '%s : une ligne par catégorie imposée, avec id, libellé, barème et icône',
    (locale) => {
      const lines = buildTrainingPrompt(locale).split('\n')
      const manquantes = TRAINING_CATEGORIES.filter((c) => {
        const scale = JSON.stringify(c.scale).replaceAll(',', ', ')
        return !lines.some(
          (l) =>
            l.includes(c.id) &&
            l.includes(c.label[locale]) &&
            l.includes(scale) &&
            l.includes(c.icon),
        )
      }).map((c) => c.id)
      expect(manquantes).toEqual([])
    },
  )

  test.each(LOCALES)('%s : impose locale et schemaVersion', (locale) => {
    const prompt = buildTrainingPrompt(locale)
    expect(prompt).toContain(`"locale": "${locale}"`)
    expect(prompt).toContain('"schemaVersion": 1')
  })

  test('fr : gabarit de answer', () => {
    const prompt = buildTrainingPrompt('fr')
    for (const s of ['**Réponse de référence**', '**Barème**', '**Pièges**', '0,5']) {
      expect(prompt).toContain(s)
    }
  })

  test('en : gabarit de answer, sans français', () => {
    const prompt = buildTrainingPrompt('en')
    for (const s of ['**Reference answer**', '**Scoring**', '**Pitfalls**', '0.5']) {
      expect(prompt).toContain(s)
    }
    for (const s of [
      'Facile',
      'Difficile',
      'Cauchemar',
      'Réponse de référence',
      'Barème',
      'Pièges',
    ]) {
      expect(prompt).not.toContain(s)
    }
  })

  test.each(LOCALES)('%s : sections numérotées 1 à 7 dans l’ordre, après l’intro', (locale) => {
    const prompt = buildTrainingPrompt(locale)
    expect(prompt.match(/^## (\d)\./gm)).toEqual([
      '## 1.',
      '## 2.',
      '## 3.',
      '## 4.',
      '## 5.',
      '## 6.',
      '## 7.',
    ])
    expect(prompt.startsWith(t(TRAINING_MESSAGES, locale, 'intro', {}))).toBe(true)
  })

  test('les barèmes imposés sont des barèmes valides', () => {
    for (const { scale } of TRAINING_CATEGORIES) {
      expect(scale[0]).toBe(0)
      const pas = scale.slice(1).map((v, i) => v - scale[i]!)
      expect(pas.every((p) => p > 0)).toBe(true)
      expect(scale.every((v) => Math.round(v * 1000) / 1000 === v)).toBe(true)
    }
  })
})
