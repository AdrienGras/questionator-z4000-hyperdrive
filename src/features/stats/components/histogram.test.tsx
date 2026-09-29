import 'fake-indexeddb/auto'
import { render, screen, within } from '@testing-library/react'
import { beforeEach, expect, test } from 'vitest'
import { db } from '@/lib/db/db'
import { putSession } from '@/lib/db/sessions'
import { renderAt } from '@/testing/render-at'
import { makeUi } from '@/testing/make-ui'
import { makeSession } from '@/testing/session-fixtures'
import { makeStudent } from '@/testing/student-fixtures'
import { HistogramChart } from './histogram-chart'
import { HistogramTable } from './histogram-table'

beforeEach(async () => {
  await db.sessions.clear()
})

const bins = [
  { from: 0, to: 1, count: 2 },
  { from: 1, to: 2, count: 0 },
  { from: 2, to: 2.5, count: 1 },
]

test('HistogramTable : libellés d’intervalle (dernier fermé) et effectifs', () => {
  render(<HistogramTable ui={makeUi('fr')} bins={bins} labelledBy="" />)

  const rows = screen.getAllByRole('row').slice(1)
  const cells = rows.map((row) => [
    within(row).getByRole('rowheader').textContent,
    within(row).getByRole('cell').textContent,
  ])
  expect(cells).toEqual([
    ['[0 ; 1[', '2'],
    ['[1 ; 2[', '0'],
    ['[2 ; 2,5]', '1'],
  ])
})

test('HistogramChart : se monte sous jsdom, masqué aux lecteurs d’écran', () => {
  const { container } = render(<HistogramChart ui={makeUi('fr')} bins={bins} />)
  expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true')
  expect(container.querySelector('[data-slot="chart"]')).not.toBeNull()
})

test('StatsView sans terminé : la phrase remplace le graphique, le tableau reste', async () => {
  await putSession(makeSession({ students: [makeStudent()] }))
  renderAt('/session/session-1/stats')

  const region = await screen.findByRole('region', { name: 'Histogramme' })
  expect(within(region).getByText("Aucun étudiant n'a terminé.")).toBeInTheDocument()
  expect(region.querySelector('[data-slot="chart"]')).toBeNull()
  expect(within(region).getByRole('table', { name: 'Histogramme' })).toBeInTheDocument()
})

test('StatsView avec un terminé : graphique présent', async () => {
  await putSession(makeSession({ students: [makeStudent([1])] }))
  renderAt('/session/session-1/stats')

  const region = await screen.findByRole('region', { name: 'Histogramme' })
  expect(region.querySelector('[data-slot="chart"]')).not.toBeNull()
})
