import 'fake-indexeddb/auto'
import { fireEvent, screen, within } from '@testing-library/react'
import { beforeEach, expect, test } from 'vitest'
import { db } from '@/lib/db/db'
import { putSession } from '@/lib/db/sessions'
import { makeSession } from '@/testing/session-fixtures'
import { attemptOf, sessionWith } from '@/testing/stats-fixtures'
import { makeConfig, makeStudent } from '@/testing/student-fixtures'
import { renderAt } from '@/testing/render-at'

beforeEach(async () => {
  await db.sessions.clear()
})

/** Valeur (`dd`) de l'indicateur `label` (`dt`) dans la région donnée. */
function indicator(region: HTMLElement, label: string): string {
  const term = within(region).getByText(label, { selector: 'dt' })
  return term.nextElementSibling?.textContent ?? ''
}

/** Cellules de la ligne dont l'en-tête de ligne vaut `label`, dans le tableau donné. */
function rowCells(table: HTMLElement, label: string): string[] {
  const header = within(table).getByRole('rowheader', { name: label })
  const row = header.closest('tr')
  if (row === null) throw new Error(`ligne ${label} introuvable`)
  return within(row)
    .getAllByRole('cell')
    .map((cell) => cell.textContent)
}

test('titre = nom de la session, retour au passage vers la vue examinateur', async () => {
  await putSession(makeSession({ name: 'Oral du lundi' }))
  renderAt('/session/session-1/stats')

  expect(await screen.findByRole('heading', { level: 1, name: 'Oral du lundi' })).toBeVisible()
  const back = screen.getByRole('link', { name: 'Retour au passage' })
  expect(back).toHaveAttribute('href', '/session/session-1')
  expect(screen.getByRole('button', { name: /Mode d'affichage/u })).toBeInTheDocument()

  fireEvent.click(back)
  expect(await screen.findByRole('heading', { name: 'Oral de test' })).toBeInTheDocument()
  expect(screen.getByRole('complementary', { name: 'Panneau latéral' })).toBeInTheDocument()
})

test('session sans terminé : les cinq indicateurs de notes affichent —', async () => {
  await putSession(makeSession({ students: [makeStudent()] }))
  renderAt('/session/session-1/stats')

  const grades = await screen.findByRole('region', { name: 'Notes finales' })
  for (const label of ['Minimum', 'Maximum', 'Moyenne', 'Médiane', 'Écart-type']) {
    expect(indicator(grades, label)).toBe('—')
  }
  expect(indicator(grades, 'Étudiants notés')).toBe('0')
  const headcount = screen.getByRole('region', { name: 'Effectifs' })
  expect(indicator(headcount, 'À passer')).toBe('1')
  expect(screen.getByRole('region', { name: 'Histogramme' })).toBeInTheDocument()
  expect(screen.getByText('Aucune question tirée.')).toBeInTheDocument()
  expect(screen.getByText('Aucune question passée.')).toBeInTheDocument()
  // Histogramme et stratégies : la même phrase, chacune dans son bloc.
  for (const name of ['Histogramme', 'Stratégies']) {
    const region = screen.getByRole('region', { name })
    expect(within(region).getByText("Aucun étudiant n'a terminé.")).toBeInTheDocument()
  }
})

test('un étudiant terminé : moyenne à 2 décimales, taux de catégorie en pourcentage', async () => {
  await putSession(makeSession({ config: makeConfig(), students: [makeStudent([1])] }))
  renderAt('/session/session-1/stats')

  const grades = await screen.findByRole('region', { name: 'Notes finales' })
  expect(indicator(grades, 'Moyenne')).toBe('10,00')
  expect(indicator(grades, 'Médiane')).toBe('10,00')
  expect(indicator(grades, 'Écart-type')).toBe('0,00')
  expect(indicator(grades, 'Minimum')).toBe('10,00')

  const categories = screen.getByRole('table', { name: 'Catégories' })
  const rate = new Intl.NumberFormat('fr', { style: 'percent' }).format(0.5)
  expect(rowCells(categories, 'A')).toEqual(['1', '1', rate])

  const strategies = screen.getByRole('table', { name: 'Stratégies' })
  expect(within(strategies).getByText('A ×1')).toBeInTheDocument()
  expect(within(strategies).getByText('10,00')).toBeInTheDocument()
})

/** Skip de la question `a-1`, avec ou sans motif. */
function skipped(reason?: string) {
  return attemptOf('a', 'a-1', reason === undefined ? {} : { skipped: reason })
}

test('question passée : motifs « Hors programme ×2, sans motif ×1 »', async () => {
  await putSession(
    sessionWith([[skipped('Hors programme')], [skipped('Hors programme')], [skipped()]]),
  )
  renderAt('/session/session-1/stats')

  const table = await screen.findByRole('table', { name: 'Questions passées' })
  expect(rowCells(table, 'Question A1')).toEqual(['A', '3', 'Hors programme ×2, sans motif ×1'])
})

test("question tirée d'id inconnu : l'id s'affiche à la place du titre", async () => {
  await putSession(sessionWith([[attemptOf('a', 'ghost-question', 1)]]))
  renderAt('/session/session-1/stats')

  const table = await screen.findByRole('table', { name: 'Questions les plus tirées' })
  expect(rowCells(table, 'ghost-question')).toEqual(['A', '1'])
})

test('locale « en » : titres des blocs en anglais', async () => {
  await putSession(makeSession({ config: { ...makeConfig(), locale: 'en' } }))
  renderAt('/session/session-1/stats')

  expect(await screen.findByRole('region', { name: 'Headcount' })).toBeInTheDocument()
  for (const name of [
    'Final scores',
    'Histogram',
    'Categories',
    'Tags',
    'Most drawn questions',
    'Skipped questions',
    'Strategies',
    'Adjustments',
  ]) {
    expect(screen.getByRole('region', { name })).toBeInTheDocument()
  }
  expect(screen.getByRole('link', { name: 'Back to the exam' })).toBeInTheDocument()
})

test('session inconnue : « introuvable »', async () => {
  renderAt('/session/nope/stats')
  expect(await screen.findByRole('heading', { name: 'Session introuvable' })).toBeInTheDocument()
})

test('ajustements : nombre, somme signée et moyenne', async () => {
  await putSession(
    makeSession({
      students: [
        makeStudent([], { id: 'student-1', adjustment: { value: 1 } }),
        makeStudent([], { id: 'student-2', order: 2, adjustment: { value: -0.5 } }),
        makeStudent([], { id: 'student-3', order: 3 }),
      ],
    }),
  )
  renderAt('/session/session-1/stats')

  const region = await screen.findByRole('region', { name: 'Ajustements' })
  expect(indicator(region, 'Nombre')).toBe('2')
  expect(indicator(region, 'Somme')).toBe('+0,50')
  expect(indicator(region, 'Moyenne')).toBe('0,25')
})
