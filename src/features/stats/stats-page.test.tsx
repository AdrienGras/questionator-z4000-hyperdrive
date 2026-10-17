import 'fake-indexeddb/auto'
import { fireEvent, screen, within } from '@testing-library/react'
import { beforeEach, expect, test } from 'vitest'
import { db } from '@/lib/db/db'
import { putSession } from '@/lib/db/sessions'
import { minimalConfig } from '@/testing/config-fixtures'
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
  expect(screen.getByRole('link', { name: 'Aide (nouvel onglet)' })).toBeInTheDocument()

  fireEvent.click(back)
  expect(await screen.findByRole('heading', { name: 'Oral de test' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Panneau' })).toBeInTheDocument()
})

test('barre de titre : « Retour au passage », nom de la session, thème dernier', async () => {
  await putSession(makeSession({ name: 'Oral du lundi' }))
  renderAt('/session/session-1/stats')

  expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('Oral du lundi')
  const banner = screen.getByRole('banner')
  expect(within(banner).getByRole('link', { name: 'Retour au passage' })).toBeInTheDocument()
})

test('session sans terminé : les cinq indicateurs de notes affichent —', async () => {
  await putSession(makeSession({ students: [makeStudent(['pending'])] }))
  renderAt('/session/session-1/stats')

  const grades = await screen.findByRole('region', { name: 'Notes finales' })
  for (const label of ['Minimum', 'Maximum', 'Écart-type']) {
    expect(indicator(grades, label)).toBe('—')
  }
  expect(indicator(grades, 'Étudiants notés')).toBe('0')
  const synthesis = screen.getByRole('region', { name: 'Chiffres clés' })
  for (const label of ['Moyenne', 'Médiane']) expect(indicator(synthesis, label)).toBe('—')
  expect(within(synthesis).getByText('1 en cours')).toBeInTheDocument()
  expect(screen.getByText('Aucune question passée.')).toBeInTheDocument()
  // Notes finales et stratégies : la même phrase, chacune dans son bloc.
  for (const name of ['Notes finales', 'Stratégies']) {
    const region = screen.getByRole('region', { name })
    expect(within(region).getByText("Aucun étudiant n'a terminé.")).toBeInTheDocument()
  }
})

test('un étudiant terminé : moyenne à 2 décimales, taux de catégorie en pourcentage', async () => {
  await putSession(makeSession({ config: makeConfig(), students: [makeStudent([1])] }))
  renderAt('/session/session-1/stats')

  const grades = await screen.findByRole('region', { name: 'Notes finales' })
  const synthesis = screen.getByRole('region', { name: 'Chiffres clés' })
  expect(indicator(synthesis, 'Moyenne')).toBe('10,00 / 20')
  expect(indicator(synthesis, 'Médiane')).toBe('10,00 / 20')
  expect(indicator(grades, 'Écart-type')).toBe('0,00')
  expect(indicator(grades, 'Minimum')).toBe('10,00')

  const categories = screen.getByRole('region', { name: 'Réussite par catégorie' })
  // `Intl` sépare le signe % par une espace insécable fine.
  expect(within(categories).getByText(/^Réussite A : 50\s%$/u)).toBeInTheDocument()
  expect(within(categories).getByText('1 notée · 1 choix')).toBeInTheDocument()

  const strategies = screen.getByRole('table', { name: 'Stratégies' })
  expect(within(strategies).getByText('A ×1')).toBeInTheDocument()
  expect(within(strategies).getByText('10,00')).toBeInTheDocument()
})

test('stratégie à deux catégories : pastilles séparées dans le nom accessible', async () => {
  const config = minimalConfig()
  config.scoring.questionsPerStudent = 2
  config.categories.push({
    id: 'b',
    label: 'B',
    scale: [0, 1, 2],
    questions: [{ id: 'b-1', prompt: 'Question B1' }],
  })
  await putSession(sessionWith([[attemptOf('a', 'a-1', 2), attemptOf('b', 'b-1', 1)]], config))
  renderAt('/session/session-1/stats')

  const table = await screen.findByRole('table', { name: 'Stratégies' })
  expect(within(table).getByRole('rowheader', { name: 'A ×1, B ×1' })).toBeInTheDocument()
})

test('tags : une ligne par tag avec notés et taux de réussite', async () => {
  const config = minimalConfig()
  config.categories = [
    {
      id: 'a',
      label: 'A',
      scale: [0, 1, 2],
      questions: [{ id: 'a-1', prompt: 'Question A1', tags: ['boucles', 'tableaux'] }],
    },
  ]
  await putSession(sessionWith([[attemptOf('a', 'a-1', 1)]], config))
  renderAt('/session/session-1/stats')

  const table = await screen.findByRole('table', { name: 'Tags' })
  const rate = new Intl.NumberFormat('fr', { style: 'percent' }).format(0.5)
  expect(rowCells(table, 'boucles')).toEqual(['1', '', rate])
  expect(rowCells(table, 'tableaux')).toEqual(['1', '', rate])
  expect(screen.getByRole('region', { name: 'Détail' })).toBeInTheDocument()
  expect(screen.queryByText("Aucune question n'a de tag.")).not.toBeInTheDocument()
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
  expect(rowCells(table, 'Question A1 A')).toEqual(['Hors programme ×2, sans motif ×1', '3'])
})

// L'id inconnu affiché à la place du titre est couvert par `domain/stats/questions.test.ts`.
test("question tirée d'id inconnu : session endommagée, statistiques non affichées (F31)", async () => {
  await putSession(sessionWith([[attemptOf('a', 'ghost-question', 1)]]))
  renderAt('/session/session-1/stats')

  expect(
    await screen.findByRole('heading', { name: 'Cette session est endommagée' }),
  ).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Exporter une sauvegarde' })).toBeInTheDocument()
  expect(screen.queryByRole('table', { name: 'Questions les plus tirées' })).not.toBeInTheDocument()
})

test('session corrompue après le montage : les statistiques basculent sur l’écran « endommagée » (F31)', async () => {
  const session = makeSession({ students: [makeStudent([1])] })
  await putSession(session)
  renderAt('/session/session-1/stats')
  await screen.findByRole('region', { name: 'Chiffres clés' })

  await db.sessions.put({ ...session, activeStudentId: 'inconnu' })

  expect(
    await screen.findByRole('heading', { name: 'Cette session est endommagée' }),
  ).toBeInTheDocument()
})

test('locale « en » : titres des blocs en anglais', async () => {
  await putSession(
    makeSession({ config: { ...makeConfig(), locale: 'en' }, students: [makeStudent([1])] }),
  )
  renderAt('/session/session-1/stats')

  expect(await screen.findByRole('region', { name: 'Key figures' })).toBeInTheDocument()
  expect(screen.getByRole('region', { name: 'Overview' })).toBeInTheDocument()
  for (const name of [
    'Final scores',
    'Success by category',
    'Tags',
    'Most drawn questions',
    'Skipped questions',
    'Strategies',
  ]) {
    expect(screen.getByRole('region', { name })).toBeInTheDocument()
  }
  expect(screen.getByRole('link', { name: 'Back to the exam' })).toBeInTheDocument()
})

test('session inconnue : « introuvable »', async () => {
  renderAt('/session/nope/stats')
  expect(await screen.findByRole('heading', { name: 'Session introuvable' })).toBeInTheDocument()
})

test('ajustements : nombre, somme signée et moyenne en pied des notes finales', async () => {
  await putSession(
    makeSession({
      students: [
        makeStudent([1], { id: 'student-1', adjustment: { value: 1 } }),
        makeStudent([], { id: 'student-2', order: 2, adjustment: { value: -0.5 } }),
        makeStudent([], { id: 'student-3', order: 3 }),
      ],
    }),
  )
  renderAt('/session/session-1/stats')

  const region = await screen.findByRole('region', { name: 'Notes finales' })
  expect(within(region).getByText(/^Ajustements/)).toHaveTextContent(
    'Ajustements 2 · somme +0,50 · moyenne 0,25',
  )
})

test('aucune tentative : état vide global, retour au passage, aucun bloc', async () => {
  await putSession(makeSession())
  renderAt('/session/session-1/stats')

  expect(
    await screen.findByRole('heading', { level: 2, name: 'Pas encore de statistiques' }),
  ).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Aller au passage' })).toHaveAttribute(
    'href',
    '/session/session-1',
  )
  expect(screen.queryByRole('region', { name: 'Synthèse' })).not.toBeInTheDocument()
})

test('une question notée, aucun terminé : page normale, histogramme vide', async () => {
  await putSession(
    makeSession({ config: makeConfig({ questionsPerStudent: 2 }), students: [makeStudent([1])] }),
  )
  renderAt('/session/session-1/stats')

  expect(await screen.findByRole('region', { name: 'Synthèse' })).toBeInTheDocument()
  expect(screen.queryByText('Pas encore de statistiques')).not.toBeInTheDocument()
  const grades = screen.getByRole('region', { name: 'Notes finales' })
  expect(within(grades).getByText("Aucun étudiant n'a terminé.")).toBeInTheDocument()
})

test('sous-titre : « Statistiques · titre · matière · promotion », parties absentes omises', async () => {
  const config = minimalConfig()
  config.exam = { title: 'Oral PHP', subject: 'Back-end', cohort: 'B2 2026' }
  await putSession(sessionWith([[attemptOf('a', 'a-1', 1)]], config))
  const { unmount } = renderAt('/session/session-1/stats')
  expect(
    await screen.findByText('Statistiques · Oral PHP · Back-end · B2 2026'),
  ).toBeInTheDocument()
  unmount()

  await putSession(sessionWith([[attemptOf('a', 'a-1', 1)]]))
  renderAt('/session/session-1/stats')
  expect(await screen.findByText('Statistiques · Oral de test')).toBeInTheDocument()
})

test('tag sans note : « — » et aucune barre', async () => {
  const config = minimalConfig()
  config.categories[0]!.questions = [{ id: 'a-1', prompt: 'Question A1', tags: ['boucles'] }]
  await putSession(sessionWith([[attemptOf('a', 'a-1', 'pending')]], config))
  renderAt('/session/session-1/stats')

  const table = await screen.findByRole('table', { name: 'Tags' })
  const row = within(table).getByRole('rowheader', { name: 'boucles' }).closest('tr')!
  expect(
    within(row)
      .getAllByRole('cell')
      .map((td) => td.textContent),
  ).toEqual(['0', '', '—'])
  expect(row.querySelector('[aria-hidden]')).toBeNull()
})
