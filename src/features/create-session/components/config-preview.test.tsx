import { render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import { configError, configWarning } from '@/domain/config/issues'
import { validateConfig, type ValidationResult } from '@/domain/config/validate'
import { t } from '@/lib/i18n/i18n'
import { UI_MESSAGES } from '@/lib/i18n/ui-messages'
import type { Ui } from '@/lib/i18n/use-ui'
import { minimalConfig } from '@/testing/config-fixtures'
import { ConfigPreview } from './config-preview'

const ui: Ui = { locale: 'fr', text: (key, params) => t(UI_MESSAGES, 'fr', key, params) }
const cssSupports = () => true

function questions(prefix: string, count: number) {
  return Array.from({ length: count }, (_, i) => ({ id: `${prefix}-${i}`, prompt: `Q${i}` }))
}

/** Config d'oral PHP de l'artboard `creation-session`, réduite à une catégorie. */
function demoConfig() {
  const base = minimalConfig()
  return {
    ...base,
    exam: { title: 'Oral PHP', subject: 'PHP', cohort: 'B2 2026' },
    scoring: { questionsPerStudent: 3, maxRawScore: 3, finalScale: 20 },
    skips: { enabled: true, maxPerStudent: 2 },
    categories: [
      { id: 'facile', label: 'Facile', scale: [0, 0.5, 1], questions: questions('f', 5) },
    ],
  }
}

function renderPreview(config: unknown) {
  const result = validateConfig(JSON.stringify(config), { cssSupports })
  return { result, ...render(<ConfigPreview ui={ui} result={result} />) }
}

describe('ConfigPreview (création)', () => {
  test('résumé en lignes intitulé / valeur', () => {
    renderPreview(demoConfig())
    const terms = screen.getAllByRole('term').map((node) => node.textContent)
    const values = screen.getAllByRole('definition').map((node) => node.textContent)
    expect(terms).toEqual([
      'Questions par étudiant',
      'Note brute → finale',
      'Arrondi',
      'Skips autorisés',
    ])
    expect(values).toEqual(['3', 'sur 3 → sur 20', 'au plus proche, 2 décimales', '2 par étudiant'])
  })

  test('catégorie : nombre de questions et barème formaté en français', () => {
    renderPreview(demoConfig())
    expect(screen.getByText('5 questions')).toBeInTheDocument()
    expect(screen.getByText('0 · 0,5 · 1')).toBeInTheDocument()
  })

  test('catégorie sans couleur ni icône : tuile neutre ; avec couleur : teintée', () => {
    const config = demoConfig()
    const { container, unmount } = renderPreview(config)
    expect(container.querySelector('li > span')).not.toHaveAttribute('style')
    unmount()
    const colored = renderPreview({
      ...config,
      categories: [{ ...config.categories[0], color: '#21d3ee' }],
    })
    expect(colored.container.querySelector('li > span')).toHaveAttribute('style')
  })

  test('matière et promotion jointes, absentes sans ligne', () => {
    const { unmount } = renderPreview(demoConfig())
    expect(screen.getByText('PHP · B2 2026')).toBeInTheDocument()
    unmount()
    renderPreview(minimalConfig())
    expect(screen.getByRole('heading', { name: 'Oral de test' }).nextElementSibling).toBeNull()
  })

  test('config invalide : nombre d’erreurs à corriger, avertissements non comptés', () => {
    const result: ValidationResult = {
      ok: false,
      issues: [
        configError('required', ['exam'], { field: 'exam' }),
        configWarning('unknown_icon', ['categories', 0, 'icon'], { icon: 'leafs' }),
        configError('empty_scale', ['categories', 0, 'scale'], {}),
      ],
    }
    render(<ConfigPreview ui={ui} result={result} />)
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('erreurs à corriger')).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(3)
  })

  test('skips désactivés', () => {
    renderPreview(minimalConfig())
    expect(screen.getByText('aucun (skips désactivés)')).toBeInTheDocument()
  })
})
