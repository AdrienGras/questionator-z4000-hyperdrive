import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { NormalizedCategory } from '@/domain/config/normalize'
import { makeUi } from '@/testing/make-ui'
import { QuestionPreview } from './question-preview'

const ui = makeUi('fr')
const category: NormalizedCategory = {
  id: 'php',
  label: 'PHP',
  scale: [0, 1, 2],
  order: 1,
  questions: [],
}

describe('QuestionPreview', () => {
  it('affiche l’en-tête, l’énoncé en taille projection et la réponse repliée', () => {
    const { container } = render(
      <QuestionPreview
        ui={ui}
        category={category}
        question={{
          id: 'q1',
          title: 'Titre Q1',
          tags: [],
          prompt: 'Énoncé **gras**',
          answer: 'Corrigé',
        }}
      />,
    )
    expect(screen.getByText('PHP')).toBeTruthy()
    expect(screen.getByText('q1')).toBeTruthy()
    expect(screen.getByText('Titre Q1')).toBeTruthy()
    expect(screen.getByText('0 / 1 / 2')).toBeTruthy()
    expect(container.querySelector('.prose-2xl')?.textContent).toContain('Énoncé gras')
    const details = container.querySelector('details')
    expect(details?.open).toBe(false)
    expect(details?.textContent).toContain('Réponse attendue')
    expect(details?.textContent).toContain('Corrigé')
  })

  it('sans réponse : pas de <details>', () => {
    const { container } = render(
      <QuestionPreview
        ui={ui}
        category={category}
        question={{ id: 'q2', title: 'T', tags: [], prompt: 'P' }}
      />,
    )
    expect(container.querySelector('details')).toBeNull()
  })
})
