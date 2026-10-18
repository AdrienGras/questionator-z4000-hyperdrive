import 'fake-indexeddb/auto'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import type { Student } from '@/domain/session/types'
import { db } from '@/lib/db/db'
import { putSession } from '@/lib/db/sessions'
import { categoryButton, outsidePanel } from '@/testing/passage-assertions'
import { renderAt } from '@/testing/render-at'
import { REVEALED, screenConfig } from '@/testing/screen-fixtures'
import { makeSession } from '@/testing/session-fixtures'
import { makeStudent, makeSecondStudent } from '@/testing/student-fixtures'
import { storedSession as stored } from '@/testing/stored-session'

beforeEach(async () => {
  await db.sessions.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
})

async function openFinal(
  student: Student,
  questionsPerStudent = 1,
  others: Student[] = [],
): Promise<void> {
  await putSession(
    makeSession({
      config: screenConfig({ questionsPerStudent }),
      students: [student, ...others],
      activeStudentId: student.id,
      projection: { mode: 'student', studentId: student.id },
    }),
  )
  renderAt('/session/session-1')
  await screen.findByRole('heading', { name: 'Passage terminé' })
}

function done(overrides: Partial<Student> = {}): Student {
  return makeStudent([13.5], { finalRevealedAt: REVEALED, ...overrides })
}

function row(label: string): HTMLElement {
  const parent = outsidePanel(label).parentElement
  if (parent === null) throw new Error(`ligne « ${label} » introuvable`)
  return parent
}

test('jauge : note finale formatée selon l’arrondi, phrase pour les lecteurs d’écran', async () => {
  await openFinal(done({ adjustment: { value: 1, reason: 'Bonne tenue' } }))

  const phrase = screen.getByText('Note finale : 14,5 sur 20')
  expect(phrase).toHaveClass('sr-only')
  // La jauge de l'examinateur (l'aperçu de la projection en montre une autre).
  expect(phrase.parentElement).toHaveTextContent(/14,5sur 20$/)
})

test('liste : brute sur le maximum, plafonnée, convertie, ajustement et justification', async () => {
  await openFinal(done({ adjustment: { value: 1, reason: 'Bonne tenue' } }))

  expect(row('Note brute')).toHaveTextContent('13,5 / 20')
  expect(row('Note plafonnée')).toHaveTextContent('13,5')
  expect(row('Note convertie')).toHaveTextContent('13,5')
  expect(row('Ajustement')).toHaveTextContent('+1,0')
  expect(row('Ajustement')).toHaveTextContent('Bonne tenue')
})

test('ajustement négatif avec le signe moins typographique', async () => {
  await openFinal(done({ adjustment: { value: -0.5 } }))

  expect(row('Ajustement')).toHaveTextContent('−0,5')
  expect(screen.getByText('Note finale : 13,0 sur 20')).toBeInTheDocument()
})

test('« aucun » sans ajustement', async () => {
  await openFinal(done())

  expect(row('Ajustement')).toHaveTextContent('aucun')
})

test('finale bornée à l’échelle : 20 + 1 donne 20,0 / 20', async () => {
  await openFinal(makeStudent([20], { finalRevealedAt: REVEALED, adjustment: { value: 1 } }))

  expect(screen.getByText('Note finale : 20,0 sur 20')).toBeInTheDocument()
})

test('détail : points sur le maximum et barre ; question passée avec son motif, hors rang', async () => {
  await openFinal(
    makeStudent([2, { skipped: 'Hors programme' }, 3], { finalRevealedAt: REVEALED }),
    2,
  )

  // Le tiroir (Sheet) et le menu latéral ont leurs propres listes : on ne garde que celles du contenu.
  const lists = screen
    .getAllByRole('list')
    .filter((list) => list.closest('[data-slot="sheet-content"], aside') === null)
  const [detail] = lists
  if (lists.length !== 1 || detail === undefined) {
    throw new Error(`${lists.length} listes hors panneau, une seule attendue`)
  }
  const items = within(detail).getAllByRole('listitem')
  expect(items).toHaveLength(3)
  expect(items[0]).toHaveTextContent(/^1Titre a-1A2 \/ 20$/)
  expect(items[1]).toHaveTextContent(/^–Titre a-2A · Hors programmePassée$/)
  expect(items[2]).toHaveTextContent(/^2Titre a-3A3 \/ 20$/)
  // Barre au prorata du maximum : 2 / 20 → 10 %, dans la couleur de la catégorie.
  expect(items[0]!.querySelector('[data-bar]')).toHaveStyle({ width: '10%' })
  expect(items[1]!.querySelector('[data-bar]')).toBeNull()
})

test('réinitialiser : confirmation, attempts vidés, commentaire conservé, grille de retour', async () => {
  await openFinal(done({ comment: 'À revoir' }))

  fireEvent.click(screen.getByRole('button', { name: 'Réinitialiser l’étudiant' }))
  const dialog = await screen.findByRole('alertdialog', { name: 'Réinitialiser Durand Alice ?' })
  expect(dialog).toHaveTextContent(
    'Les questions tirées, les notes et l’ajustement seront supprimés. Le commentaire est conservé.',
  )
  fireEvent.click(within(dialog).getByRole('button', { name: 'Réinitialiser' }))

  expect(await categoryButton('A')).toBeInTheDocument()
  const student = (await stored()).students[0]
  expect(student?.attempts).toEqual([])
  expect(student?.comment).toBe('À revoir')
})

test('réinitialisation en échec : dialogue ouvert avec le message d’erreur, attempts intacts', async () => {
  await openFinal(done())
  fireEvent.click(screen.getByRole('button', { name: 'Réinitialiser l’étudiant' }))
  const dialog = await screen.findByRole('alertdialog')
  vi.spyOn(db.sessions, 'put').mockRejectedValueOnce(new Error('disque plein'))

  fireEvent.click(within(dialog).getByRole('button', { name: 'Réinitialiser' }))

  expect(await within(dialog).findByRole('alert')).toHaveTextContent("L'enregistrement a échoué")
  // Une seule alerte : celle du dialogue, pas celle de la page (D82).
  expect(screen.getAllByRole('alert', { hidden: true })).toHaveLength(1)
  expect(screen.getByRole('alertdialog')).toBeInTheDocument()
  expect((await stored()).students[0]?.attempts).toHaveLength(1)
})

test('annuler la réinitialisation n’écrit rien', async () => {
  await openFinal(done())
  const before = await stored()

  fireEvent.click(screen.getByRole('button', { name: 'Réinitialiser l’étudiant' }))
  const dialog = await screen.findByRole('alertdialog')
  fireEvent.click(within(dialog).getByRole('button', { name: 'Annuler' }))

  await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
  expect(await stored()).toEqual(before)
})

test('« Étudiant suivant » change l’étudiant actif et remet la projection en attente (D73)', async () => {
  await openFinal(done(), 1, [makeSecondStudent()])

  fireEvent.click(screen.getByRole('button', { name: 'Étudiant suivant' }))

  expect(await screen.findByText('Martin Bob')).toBeInTheDocument()
  const session = await stored()
  expect(session.activeStudentId).toBe('student-2')
  expect(session.projection).toEqual({ mode: 'waiting' })
})

test('dernier étudiant restant : bouton désactivé et mention visible', async () => {
  await openFinal(done(), 1, [makeSecondStudent([], { absent: true })])

  expect(screen.getByRole('button', { name: 'Étudiant suivant' })).toBeDisabled()
  expect(screen.getByText('Tous les étudiants sont passés')).toBeVisible()
})

test('le bouton « Ajuster la note » est rendu', async () => {
  await openFinal(done())

  expect(screen.getByRole('button', { name: 'Ajuster la note' })).toBeEnabled()
})
