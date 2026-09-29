import 'fake-indexeddb/auto'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import type { NormalizedCategory } from '@/domain/config/normalize'
import { setActiveStudent } from '@/domain/passage/active-student'
import type { Student } from '@/domain/session/types'
import { db } from '@/lib/db/db'
import { putSession, updateSession } from '@/lib/db/sessions'
import { categoryButton } from '@/testing/passage-assertions'
import { renderAt } from '@/testing/render-at'
import { makeSession } from '@/testing/session-fixtures'
import { makeConfig, makeStudent } from '@/testing/student-fixtures'

/** Catégorie `a` à 3 questions : `makeStudent` fabrique `attempt-2` et au-delà. */
const category: NormalizedCategory = {
  id: 'a',
  label: 'A',
  scale: [0, 1, 2, 3],
  order: 1,
  questions: ['a-1', 'a-2', 'a-3'].map((id) => ({
    id,
    title: `Titre ${id}`,
    tags: [],
    prompt: id,
  })),
}

const REVEALED = '2026-09-25T10:00:00.000Z'
const ABSENT_BODY = 'Décochez « Absent » dans le panneau pour le faire passer.'
/** Au-delà du délai de sauvegarde différée (500 ms). */
const AFTER_DELAY = { timeout: 2000 }

async function mount(students: Student[], questionsPerStudent = 3) {
  const config = {
    ...makeConfig({
      questionsPerStudent,
      maxRawScore: 20,
      finalScale: 20,
      rounding: { mode: 'nearest', decimals: 2, step: 0.5 },
    }),
    categories: [category],
  }
  await putSession(makeSession({ config, students, activeStudentId: students[0]?.id }))
  const rendered = renderAt('/session/session-1')
  await screen.findByRole('complementary', { name: 'Panneau latéral' })
  return rendered
}

function panel(): HTMLElement {
  return screen.getByRole('complementary', { name: 'Panneau latéral' })
}

function commentBox(): HTMLElement {
  return within(panel()).getByRole('textbox', { name: 'Commentaire' })
}

function absentBox(): HTMLElement {
  return within(panel()).getByRole('checkbox', { name: 'Absent' })
}

async function stored() {
  const session = await db.sessions.get('session-1')
  if (session === undefined) throw new Error('session absente')
  return session
}

async function storedStudent(id = 'student-1') {
  const student = (await stored()).students.find((s) => s.id === id)
  if (student === undefined) throw new Error(`étudiant ${id} absent`)
  return student
}

function bob(): Student {
  return makeStudent([], {
    id: 'student-2',
    lastName: 'Martin',
    firstName: 'Bob',
    order: 2,
  })
}

beforeEach(async () => {
  localStorage.clear()
  await db.sessions.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
})

test('commentaire : rien en base avant le délai, enregistré après, indicateur « Enregistré »', async () => {
  await mount([makeStudent([])])

  fireEvent.change(commentBox(), { target: { value: 'À revoir' } })

  expect((await storedStudent()).comment).toBeUndefined()
  await waitFor(async () => expect((await storedStudent()).comment).toBe('À revoir'), AFTER_DELAY)
  expect(await within(panel()).findByText('Enregistré')).toBeInTheDocument()
})

test('commentaire : la sortie du champ écrit tout de suite', async () => {
  await mount([makeStudent([])])
  const put = vi.spyOn(db.sessions, 'put')
  // Le temps est figé : le délai de 500 ms ne peut pas partir, seule la sortie du champ peut écrire.
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
  try {
    fireEvent.change(commentBox(), { target: { value: 'Très clair' } })
    await Promise.resolve()
    expect(put).not.toHaveBeenCalled()

    fireEvent.blur(commentBox())

    await vi.waitFor(async () => expect((await storedStudent()).comment).toBe('Très clair'))
    expect(put).toHaveBeenCalledTimes(1)
  } finally {
    vi.useRealTimers()
  }
})

test('commentaire : taper puis revenir au texte d’origine et sortir n’écrit rien', async () => {
  await mount([makeStudent([], { comment: 'Déjà là' })])
  const before = (await stored()).updatedAt
  const put = vi.spyOn(db.sessions, 'put')

  fireEvent.change(commentBox(), { target: { value: 'Déjà là !' } })
  fireEvent.change(commentBox(), { target: { value: 'Déjà là' } })
  fireEvent.blur(commentBox())

  // La sauvegarde est bien partie (indicateur), mais sans changement : rien n'est écrit.
  expect(await within(panel()).findByText('Enregistré')).toBeInTheDocument()
  expect(put).not.toHaveBeenCalled()
  expect((await stored()).updatedAt).toBe(before)
})

test('commentaire : entrer et sortir sans frappe n’écrit rien', async () => {
  await mount([makeStudent([], { comment: 'Déjà là' })])
  const before = (await stored()).updatedAt

  fireEvent.focus(commentBox())
  fireEvent.blur(commentBox())
  await new Promise((resolve) => setTimeout(resolve, 700))

  expect((await stored()).updatedAt).toBe(before)
  expect(within(panel()).queryByText('Enregistré')).not.toBeInTheDocument()
})

test('commentaire : survit au rechargement et à la réinitialisation', async () => {
  const { unmount } = await mount([makeStudent([2, 1], { finalRevealedAt: REVEALED })], 2)
  fireEvent.change(commentBox(), { target: { value: 'Bonne tenue' } })
  fireEvent.blur(commentBox())
  await waitFor(async () => expect((await storedStudent()).comment).toBe('Bonne tenue'))
  unmount()

  renderAt('/session/session-1')
  await screen.findByRole('heading', { name: 'Passage terminé' })
  expect(commentBox()).toHaveValue('Bonne tenue')

  fireEvent.click(screen.getByRole('button', { name: 'Réinitialiser l’étudiant' }))
  const dialog = await screen.findByRole('alertdialog', { name: 'Réinitialiser Durand Alice ?' })
  fireEvent.click(within(dialog).getByRole('button', { name: 'Réinitialiser' }))

  expect(await categoryButton('A')).toBeInTheDocument()
  expect((await storedStudent()).comment).toBe('Bonne tenue')
  expect(commentBox()).toHaveValue('Bonne tenue')
})

test('commentaire tapé puis changement d’étudiant avant le délai : enregistré sur le premier', async () => {
  await mount([makeStudent([]), bob()])

  fireEvent.change(commentBox(), { target: { value: 'Pour Alice' } })
  fireEvent.change(screen.getByRole('combobox', { name: 'Étudiant' }), {
    target: { value: 'student-2' },
  })

  await waitFor(async () => expect((await stored()).activeStudentId).toBe('student-2'))
  await waitFor(async () => expect((await storedStudent('student-1')).comment).toBe('Pour Alice'))
  expect((await storedStudent('student-2')).comment).toBeUndefined()
  await waitFor(() => expect(commentBox()).toHaveValue(''))
})

test('absent sans question tirée : écrit sans dialogue, écran d’absence', async () => {
  await mount([makeStudent([])])
  await categoryButton('A')

  fireEvent.click(absentBox())

  expect(await screen.findByText(ABSENT_BODY)).toBeInTheDocument()
  expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  expect((await storedStudent()).absent).toBe(true)
  expect(absentBox()).toBeChecked()
})

test('absent avec questions tirées : « Annuler » n’écrit rien', async () => {
  await mount([makeStudent([2, 1], { comment: 'À revoir' })])
  await categoryButton('A')
  const before = await stored()

  fireEvent.click(absentBox())
  const dialog = await screen.findByRole('alertdialog', { name: 'Déclarer Durand Alice absent ?' })
  expect(dialog).toHaveTextContent(
    'Ce passage contient 2 questions tirées. Déclarer l’étudiant absent les supprime. Le commentaire est conservé.',
  )
  fireEvent.click(within(dialog).getByRole('button', { name: 'Annuler' }))

  await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
  expect(await stored()).toEqual(before)
  expect(absentBox()).not.toBeChecked()
})

test('absent avec questions tirées : « Déclarer absent » vide les attempts, garde le commentaire', async () => {
  await mount([makeStudent([2, 1], { comment: 'À revoir' })])
  await categoryButton('A')

  fireEvent.click(absentBox())
  const dialog = await screen.findByRole('alertdialog', { name: 'Déclarer Durand Alice absent ?' })
  fireEvent.click(within(dialog).getByRole('button', { name: 'Déclarer absent' }))

  expect(await screen.findByText(ABSENT_BODY)).toBeInTheDocument()
  await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
  const student = await storedStudent()
  expect(student.absent).toBe(true)
  expect(student.attempts).toEqual([])
  expect(student.comment).toBe('À revoir')
})

test('terminé, révélé et ajusté : absent puis décoché revient à la grille, sans ajustement', async () => {
  await mount(
    [
      makeStudent([2, 1], {
        finalRevealedAt: REVEALED,
        adjustment: { value: 1, reason: 'Bonne tenue' },
        comment: 'À revoir',
      }),
    ],
    2,
  )
  await screen.findByRole('heading', { name: 'Passage terminé' })

  fireEvent.click(absentBox())
  const dialog = await screen.findByRole('alertdialog', { name: 'Déclarer Durand Alice absent ?' })
  fireEvent.click(within(dialog).getByRole('button', { name: 'Déclarer absent' }))
  expect(await screen.findByText(ABSENT_BODY)).toBeInTheDocument()
  await waitFor(() => expect(absentBox()).toBeEnabled())

  fireEvent.click(absentBox())

  expect(await categoryButton('A')).toBeInTheDocument()
  const student = await storedStudent()
  expect(student.absent).toBe(false)
  expect(student.attempts).toEqual([])
  expect(student.adjustment).toBeUndefined()
  expect(student.finalRevealedAt).toBeUndefined()
  expect(student.comment).toBe('À revoir')
  expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
})

test('échec d’écriture sur « Déclarer absent » : dialogue ouvert avec le message d’erreur', async () => {
  await mount([makeStudent([2, 1])])
  await categoryButton('A')

  fireEvent.click(absentBox())
  const dialog = await screen.findByRole('alertdialog')
  vi.spyOn(db.sessions, 'put').mockRejectedValueOnce(new Error('disque plein'))
  fireEvent.click(within(dialog).getByRole('button', { name: 'Déclarer absent' }))

  expect(await within(dialog).findByRole('alert')).toHaveTextContent("L'enregistrement a échoué")
  expect(screen.getByRole('alertdialog')).toBeInTheDocument()
  const student = await storedStudent()
  expect(student.absent).toBe(false)
  expect(student.attempts).toHaveLength(2)
})

test('dialogue d’absence ouvert pour Alice, Bob devient actif ailleurs : c’est Alice qui est absente', async () => {
  await mount([makeStudent([2, 1]), { ...bob(), attempts: makeStudent([1]).attempts }])
  await categoryButton('A')

  fireEvent.click(absentBox())
  const dialog = await screen.findByRole('alertdialog', { name: 'Déclarer Durand Alice absent ?' })
  // Un autre onglet change l'étudiant actif pendant que le dialogue est ouvert.
  await updateSession('session-1', (s) => setActiveStudent(s, 'student-2'))
  // Le dialogue modal masque le reste de la page : `hidden` pour atteindre le sélecteur.
  await waitFor(() =>
    expect(screen.getByRole('combobox', { name: 'Étudiant', hidden: true })).toHaveValue(
      'student-2',
    ),
  )
  expect(screen.getByRole('alertdialog', { name: 'Déclarer Durand Alice absent ?' })).toBe(dialog)

  fireEvent.click(within(dialog).getByRole('button', { name: 'Déclarer absent' }))

  await waitFor(async () => expect((await storedStudent('student-1')).absent).toBe(true))
  expect((await storedStudent('student-1')).attempts).toEqual([])
  const other = await storedStudent('student-2')
  expect(other.absent).toBe(false)
  expect(other.attempts).toHaveLength(1)
})
