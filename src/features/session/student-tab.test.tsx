import 'fake-indexeddb/auto'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { setActiveStudent } from '@/domain/passage/active-student'
import type { Student } from '@/domain/session/types'
import { db } from '@/lib/db/db'
import { putSession, updateSession } from '@/lib/db/sessions'
import { categoryButton } from '@/testing/passage-assertions'
import { renderAt } from '@/testing/render-at'
import { expectPanelClosed, openSidePanel } from '@/testing/side-panel-assertions'
import { panel, REVEALED, screenConfig } from '@/testing/screen-fixtures'
import { makeSession } from '@/testing/session-fixtures'
import { makeStudent, makeSecondStudent } from '@/testing/student-fixtures'
import { storedSession as stored, storedStudent } from '@/testing/stored-session'

const ABSENT_BODY = 'Cliquez « Marquer présent » dans le panneau pour le faire passer.'
/** Au-delà du délai de sauvegarde différée (500 ms). */
const AFTER_DELAY = { timeout: 2000 }

async function mount(students: Student[], questionsPerStudent = 3) {
  const config = screenConfig({ questionsPerStudent })
  await putSession(makeSession({ config, students, activeStudentId: students[0]?.id }))
  const rendered = renderAt('/session/session-1')
  await openSidePanel('Étudiant')
  return rendered
}

/**
 * Grille de tirage, attendue. `hidden` : le tiroir modal ouvert masque le reste de la page aux
 * requêtes par rôle.
 */
function grid(): Promise<HTMLElement> {
  return screen.findByRole('list', { name: 'Choisir une catégorie', hidden: true })
}

async function closePanel() {
  fireEvent.keyDown(panel(), { key: 'Escape' })
  await expectPanelClosed()
}

function commentBox(): HTMLElement {
  return within(panel()).getByRole('textbox', { name: 'Commentaire' })
}

/** Bouton d'absence de l'onglet « Étudiant » (« Marquer absent » ou « Marquer présent »). */
function absentButton(): HTMLElement {
  return within(panel()).getByRole('button', { name: /^Marquer (absent|présent)$/ })
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
  expect(await within(panel()).findAllByText('Enregistré')).not.toHaveLength(0)
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
  expect(await within(panel()).findAllByText('Enregistré')).not.toHaveLength(0)
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
  expect(within(panel()).queryAllByText('Enregistré')).toHaveLength(0)
})

test('commentaire : survit au rechargement et à la réinitialisation', async () => {
  const { unmount } = await mount([makeStudent([2, 1], { finalRevealedAt: REVEALED })], 2)
  fireEvent.change(commentBox(), { target: { value: 'Bonne tenue' } })
  fireEvent.blur(commentBox())
  await waitFor(async () => expect((await storedStudent()).comment).toBe('Bonne tenue'))
  unmount()

  renderAt('/session/session-1')
  await screen.findByRole('heading', { name: 'Passage terminé' })
  await openSidePanel()
  expect(commentBox()).toHaveValue('Bonne tenue')
  await closePanel()

  fireEvent.click(screen.getByRole('button', { name: 'Réinitialiser l’étudiant' }))
  const dialog = await screen.findByRole('alertdialog', { name: 'Réinitialiser Durand Alice ?' })
  fireEvent.click(within(dialog).getByRole('button', { name: 'Réinitialiser' }))

  expect(await categoryButton('A')).toBeInTheDocument()
  expect((await storedStudent()).comment).toBe('Bonne tenue')
  await openSidePanel()
  expect(commentBox()).toHaveValue('Bonne tenue')
})

test('commentaire tapé puis changement d’étudiant avant le délai : enregistré sur le premier', async () => {
  await mount([makeStudent([]), makeSecondStudent()])

  fireEvent.change(commentBox(), { target: { value: 'Pour Alice' } })
  // L'onglet « Étudiant » reste monté : seul le changement d'étudiant démonte `CommentField`
  // (clé par étudiant), comme lors d'une écriture venue d'un autre onglet du navigateur.
  await updateSession('session-1', (s) => setActiveStudent(s, 'student-2'))

  await waitFor(async () => expect((await storedStudent('student-1')).comment).toBe('Pour Alice'))
  expect((await storedStudent('student-2')).comment).toBeUndefined()
  await waitFor(() => expect(commentBox()).toHaveValue(''))
})

test('commentaire tapé puis passage à l’onglet « Étudiants » : enregistré, étudiant suivant vide', async () => {
  await mount([makeStudent([]), makeSecondStudent()])

  fireEvent.change(commentBox(), { target: { value: 'Pour Alice' } })
  fireEvent.click(within(panel()).getByRole('tab', { name: 'Étudiants' }))
  fireEvent.click(within(panel()).getByRole('button', { name: /^Martin Bob/ }))

  await waitFor(async () => expect((await stored()).activeStudentId).toBe('student-2'))
  await waitFor(async () => expect((await storedStudent('student-1')).comment).toBe('Pour Alice'))
  expect((await storedStudent('student-2')).comment).toBeUndefined()
  // Le changement d'étudiant a fermé le tiroir : rouvert sur l'onglet « Étudiant ».
  await expectPanelClosed()
  await openSidePanel('Étudiant')
  await waitFor(() => expect(commentBox()).toHaveValue(''))
})

test('absent sans question tirée : écrit sans dialogue, écran d’absence', async () => {
  await mount([makeStudent([])])
  await grid()

  fireEvent.click(absentButton())

  expect(await screen.findByText(ABSENT_BODY)).toBeInTheDocument()
  expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  expect((await storedStudent()).absent).toBe(true)
  expect(absentButton()).toHaveAccessibleName('Marquer présent')
})

test('absent avec questions tirées : « Annuler » n’écrit rien', async () => {
  await mount([makeStudent([2, 1], { comment: 'À revoir' })])
  await grid()
  const before = await stored()

  fireEvent.click(absentButton())
  const dialog = await screen.findByRole('alertdialog', { name: 'Déclarer Durand Alice absent ?' })
  expect(dialog).toHaveTextContent(
    'Ce passage contient 2 questions tirées. Déclarer l’étudiant absent les supprime. Le commentaire est conservé.',
  )
  fireEvent.click(within(dialog).getByRole('button', { name: 'Annuler' }))

  await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
  expect(await stored()).toEqual(before)
  expect(absentButton()).toHaveAccessibleName('Marquer absent')
})

test('absent avec questions tirées : « Déclarer absent » vide les attempts, garde le commentaire', async () => {
  await mount([makeStudent([2, 1], { comment: 'À revoir' })])
  await grid()

  fireEvent.click(absentButton())
  const dialog = await screen.findByRole('alertdialog', { name: 'Déclarer Durand Alice absent ?' })
  fireEvent.click(within(dialog).getByRole('button', { name: 'Déclarer absent' }))

  expect(await screen.findByText(ABSENT_BODY)).toBeInTheDocument()
  await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
  const student = await storedStudent()
  expect(student.absent).toBe(true)
  expect(student.attempts).toEqual([])
  expect(student.comment).toBe('À revoir')
})

test('terminé, révélé et ajusté : absent puis présent revient à la grille, sans ajustement', async () => {
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
  await screen.findByRole('heading', { name: 'Passage terminé', hidden: true })

  fireEvent.click(absentButton())
  const dialog = await screen.findByRole('alertdialog', { name: 'Déclarer Durand Alice absent ?' })
  fireEvent.click(within(dialog).getByRole('button', { name: 'Déclarer absent' }))
  expect(await screen.findByText(ABSENT_BODY)).toBeInTheDocument()
  await waitFor(() => expect(absentButton()).toBeEnabled())

  fireEvent.click(absentButton())

  expect(await grid()).toBeInTheDocument()
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
  await grid()

  fireEvent.click(absentButton())
  const dialog = await screen.findByRole('alertdialog')
  vi.spyOn(db.sessions, 'put').mockRejectedValueOnce(new Error('disque plein'))
  fireEvent.click(within(dialog).getByRole('button', { name: 'Déclarer absent' }))

  expect(await within(dialog).findByRole('alert')).toHaveTextContent("L'enregistrement a échoué")
  // Une seule alerte : celle du dialogue, pas celle de la page (D82).
  expect(screen.getAllByRole('alert', { hidden: true })).toHaveLength(1)
  expect(screen.getByRole('alertdialog')).toBeInTheDocument()
  const student = await storedStudent()
  expect(student.absent).toBe(false)
  expect(student.attempts).toHaveLength(2)
})

test('marquer présent sans dialogue, écriture en échec : l’alerte de page reste affichée', async () => {
  await mount([makeStudent([], { absent: true })])
  await screen.findByText(ABSENT_BODY)
  vi.spyOn(db.sessions, 'put').mockRejectedValueOnce(new Error('disque plein'))

  fireEvent.click(absentButton())

  expect(await screen.findByRole('alert')).toHaveTextContent('Rechargez la page')
  expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  expect((await storedStudent()).absent).toBe(true)
})

test('dialogue d’absence ouvert pour Alice, Bob devient actif ailleurs : c’est Alice qui est absente', async () => {
  // Ids d'attempts propres à Bob : un id en double rendrait la session endommagée (F31).
  const bobAttempts = makeStudent([1]).attempts.map((attempt) => ({ ...attempt, id: 'bob-1' }))
  await mount([makeStudent([2, 1]), { ...makeSecondStudent(), attempts: bobAttempts }])
  await grid()

  fireEvent.click(absentButton())
  const dialog = await screen.findByRole('alertdialog', { name: 'Déclarer Durand Alice absent ?' })
  // Un autre onglet change l'étudiant actif pendant que le dialogue est ouvert.
  await updateSession('session-1', (s) => setActiveStudent(s, 'student-2'))
  // Le dialogue modal masque le reste de la page et les onglets inactifs sont démontés : on
  // vérifie le changement d'étudiant actif en base puis dans l'en-tête.
  await waitFor(async () => expect((await stored()).activeStudentId).toBe('student-2'))
  // L'en-tête (masqué par le dialogue mais présent) montre bien Bob comme étudiant actif.
  await waitFor(() => expect(screen.getByText('Martin Bob')).toBeInTheDocument())
  expect(screen.getByRole('alertdialog', { name: 'Déclarer Durand Alice absent ?' })).toBe(dialog)

  fireEvent.click(within(dialog).getByRole('button', { name: 'Déclarer absent' }))

  await waitFor(async () => expect((await storedStudent('student-1')).absent).toBe(true))
  expect((await storedStudent('student-1')).attempts).toEqual([])
  const other = await storedStudent('student-2')
  expect(other.absent).toBe(false)
  expect(other.attempts).toHaveLength(1)
})

/** Zone annoncée aux lecteurs d'écran (`aria-live`) du champ commentaire. */
function announcer(): HTMLElement {
  const region = panel().querySelector<HTMLElement>('[aria-live="polite"]')
  if (region === null) throw new Error('zone annoncée absente')
  return region
}

test('commentaire : zone annoncée vide pendant l’enregistrement, « Enregistré » ensuite', async () => {
  await mount([makeStudent([])])
  const visible: string[] = []
  const announced: string[] = []
  const observer = new MutationObserver(() => {
    visible.push(
      ...within(panel())
        .queryAllByText('Enregistrement…')
        .map(() => 'saving'),
    )
    announced.push(announcer().textContent)
  })
  observer.observe(panel(), { subtree: true, childList: true, characterData: true })

  fireEvent.change(commentBox(), { target: { value: 'À revoir' } })
  fireEvent.blur(commentBox())

  await waitFor(() => expect(announcer()).toHaveTextContent('Enregistré'))
  observer.disconnect()
  // Le statut visible est passé par « Enregistrement… », la zone annoncée jamais.
  expect(visible).not.toHaveLength(0)
  expect(announced).not.toContain('Enregistrement…')
  expect(within(panel()).getAllByText('Enregistré')).toHaveLength(2)
})

test('commentaire : échec, la zone annoncée contient « Échec de l’enregistrement »', async () => {
  await mount([makeStudent([])])
  vi.spyOn(db.sessions, 'put').mockRejectedValueOnce(new Error('disque plein'))

  fireEvent.change(commentBox(), { target: { value: 'À revoir' } })
  fireEvent.blur(commentBox())

  await waitFor(() => expect(announcer()).toHaveTextContent('Échec de l’enregistrement'))
})

test('commentaire tapé puis tiroir fermé par Échap avant le délai : enregistré en base', async () => {
  await mount([makeStudent([])])

  fireEvent.change(commentBox(), { target: { value: 'Avant fermeture' } })
  await closePanel()

  // Délai borné sous les 500 ms d'autosave : seule l'écriture au démontage peut arriver à temps.
  await waitFor(async () => expect((await storedStudent()).comment).toBe('Avant fermeture'), {
    timeout: 250,
  })
})
