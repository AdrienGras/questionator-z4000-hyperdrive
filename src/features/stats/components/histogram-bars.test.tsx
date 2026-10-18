import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import type { HistogramBin } from '@/domain/stats/types'
import { makeUi } from '@/testing/make-ui'
import { HistogramBars } from './histogram-bars'

/** `count` barres de largeur `width`, effectifs donnés par index. */
function bins(count: number, width: number, counts: Record<number, number> = {}): HistogramBin[] {
  return Array.from({ length: count }, (_, k) => ({
    from: k * width,
    to: (k + 1) * width,
    count: counts[k] ?? 0,
  }))
}

/** Libellés de l'axe, dans l'ordre. */
function ticks(container: HTMLElement): string[] {
  return [...container.querySelectorAll('[data-axis] > span')].map((t) => t.textContent)
}

test('phrase des barres non vides, dessin caché', () => {
  const { container } = render(
    <HistogramBars ui={makeUi()} bins={bins(20, 1, { 8: 1, 13: 2 })} finalScale={20} count={3} />,
  )
  expect(
    screen.getByText('Notes des 3 étudiants notés : 1 entre 8 et 9, 2 entre 13 et 14'),
  ).toHaveClass('sr-only')
  const columns = container.querySelectorAll<HTMLElement>('[data-bin]')
  expect(columns).toHaveLength(20)
  expect(columns[0]!.closest('[aria-hidden="true"]')).not.toBeNull()
  expect(columns[13]!.querySelector<HTMLElement>('[data-bar]')?.style.height).toBe('10.5rem')
  expect(columns[8]!.querySelector<HTMLElement>('[data-bar]')?.style.height).toBe('5.25rem')
  expect(columns[0]!.querySelector('[data-bar]')).toBeNull()
  expect(columns[13]).toHaveTextContent('2')
  expect(ticks(container)).toEqual(['0', '5', '10', '15', '20'])
})

test('un seul étudiant noté : singulier', () => {
  render(<HistogramBars ui={makeUi()} bins={bins(20, 1, { 19: 1 })} finalScale={20} count={1} />)
  expect(screen.getByText('Note de l’étudiant noté : 1 entre 19 et 20')).toBeInTheDocument()
})

test('barème final de 100 ou de 2,5 : axe aux quarts du barème', () => {
  const { container: hundred } = render(
    <HistogramBars ui={makeUi()} bins={bins(20, 5, { 0: 1 })} finalScale={100} count={1} />,
  )
  expect(ticks(hundred)).toEqual(['0', '25', '50', '75', '100'])
  const { container: small } = render(
    <HistogramBars ui={makeUi()} bins={bins(3, 1, { 2: 1 })} finalScale={2.5} count={1} />,
  )
  expect(ticks(small)).toEqual(['0', '0,625', '1,25', '1,875', '2,5'])
})

test('anglais : phrase traduite', () => {
  render(<HistogramBars ui={makeUi('en')} bins={bins(20, 1, { 8: 2 })} finalScale={20} count={2} />)
  expect(screen.getByText('Scores of the 2 scored students: 2 between 8 and 9')).toBeInTheDocument()
})
