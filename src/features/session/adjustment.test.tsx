import 'fake-indexeddb/auto'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import type { Student } from '@/domain/session/types'
import { db } from '@/lib/db/db'
import { putSession } from '@/lib/db/sessions'
import { categoryButton } from '@/testing/passage-assertions'
import { renderAt } from '@/testing/render-at'
import { REVEALED, screenCategory } from '@/testing/screen-fixtures'
import { makeSession } from '@/testing/session-fixtures'
import { makeConfig, makeStudent } from '@/testing/student-fixtures'

function config(step = 0.5) {
  return {
    ...makeConfig({
      questionsPerStudent: 1,
      maxRawScore: 20,
      finalScale: 20,
      rounding: { mode: 'nearest', decimals: 2, step },
    }),
    categories: [screenCategory],
  }
}

beforeEach(async () => {
  await db.sessions.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
})

async function mount(student: Student, step = 0.5): Promise<void> {
  await putSession(
    makeSession({ config: config(step), students: [student], activeStudentId: student.id }),
  )
  renderAt('/session/session-1')
}

async function stored() {
  const session = await db.sessions.get('session-1')
  const student = session?.students[0]
  if (session === undefined || student === undefined) throw new Error('session absente')
  return { session, student }
}

function findDialog(): Promise<HTMLElement> {
  return screen.findByRole('dialog', { name: 'Ajuster la note' })
}

async function dialogClosed(): Promise<void> {
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
}

function field(dialog: HTMLElement): HTMLInputElement {
  const input = within(dialog).getByLabelText('Ajustement')
  if (!(input instanceof HTMLInputElement)) throw new Error('champ introuvable')
  return input
}

function type(dialog: HTMLElement, value: string): void {
  fireEvent.change(field(dialog), { target: { value } })
}

function button(dialog: HTMLElement, name: string): HTMLElement {
  return within(dialog).getByRole('button', { name })
}

test('la dernière note donnée ouvre la popup', async () => {
  await mount(makeStudent(['pending']))

  fireEvent.click(await screen.findByRole('button', { name: 'Noter 2' }))

  expect(await findDialog()).toBeInTheDocument()
})

test('étudiant terminé sans révélation : popup ouverte au montage', async () => {
  await mount(makeStudent([13.5]))

  expect(await findDialog()).toBeInTheDocument()
})

test('étudiant déjà révélé : pas de popup, « Ajuster » l’ouvre, préremplie', async () => {
  await mount(
    makeStudent([13.5], {
      finalRevealedAt: REVEALED,
      adjustment: { value: -0.5, reason: 'Hésitant' },
    }),
  )
  await screen.findByRole('heading', { name: 'Passage terminé' })
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

  fireEvent.click(screen.getByRole('button', { name: 'Ajuster' }))

  const dialog = await findDialog()
  expect(field(dialog)).toHaveValue('-0,5')
  expect(within(dialog).getByLabelText('Justification (facultative)')).toHaveValue('Hésitant')
  expect(within(dialog).getByText('13,5 − 0,5 = 13,0 / 20')).toBeInTheDocument()
})

test('fin de passage, « Annuler » : note révélée sans ajustement, popup fermée pour de bon', async () => {
  await mount(makeStudent([13.5]))
  const dialog = await findDialog()
  expect(field(dialog)).toHaveValue('0')

  fireEvent.click(button(dialog, 'Annuler'))

  await dialogClosed()
  const { student } = await stored()
  expect(student.finalRevealedAt).toEqual(expect.any(String))
  expect(student.adjustment).toBeUndefined()
  await new Promise((resolve) => setTimeout(resolve, 50))
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})

test('fin de passage, Échap : même chemin qu’« Annuler »', async () => {
  await mount(makeStudent([13.5]))
  const dialog = await findDialog()

  fireEvent.keyDown(dialog, { key: 'Escape' })

  await dialogClosed()
  expect((await stored()).student.finalRevealedAt).toEqual(expect.any(String))
})

test('mode « ajuster », « Annuler » : aucune écriture', async () => {
  await mount(makeStudent([13.5], { finalRevealedAt: REVEALED }))
  await screen.findByRole('heading', { name: 'Passage terminé' })
  const before = (await stored()).session

  fireEvent.click(screen.getByRole('button', { name: 'Ajuster' }))
  const dialog = await findDialog()
  type(dialog, '1')
  fireEvent.click(button(dialog, 'Annuler'))

  await dialogClosed()
  expect((await stored()).session.updatedAt).toBe(before.updatedAt)
})

test('fin de passage, « Enregistrer » : ajustement, justification et révélation', async () => {
  await mount(makeStudent([13.5]))
  const dialog = await findDialog()

  type(dialog, '1')
  fireEvent.change(within(dialog).getByLabelText('Justification (facultative)'), {
    target: { value: 'Bonne tenue' },
  })
  fireEvent.click(button(dialog, 'Enregistrer'))

  await dialogClosed()
  const { student } = await stored()
  expect(student.adjustment).toEqual({ value: 1, reason: 'Bonne tenue' })
  expect(student.finalRevealedAt).toEqual(expect.any(String))
})

test('mode « ajuster », « Enregistrer » : ajustement sans toucher à la révélation', async () => {
  await mount(makeStudent([13.5], { finalRevealedAt: REVEALED }))
  await screen.findByRole('heading', { name: 'Passage terminé' })

  fireEvent.click(screen.getByRole('button', { name: 'Ajuster' }))
  const dialog = await findDialog()
  type(dialog, '−1,5')
  fireEvent.click(button(dialog, 'Enregistrer'))

  await dialogClosed()
  const { student } = await stored()
  expect(student.adjustment).toEqual({ value: -1.5 })
  expect(student.finalRevealedAt).toBe(REVEALED)
})

test('calcul en direct', async () => {
  await mount(makeStudent([13.5]))
  const dialog = await findDialog()

  expect(within(dialog).getByText('13,5 + 0,0 = 13,5 / 20')).toBeInTheDocument()
  type(dialog, '1')
  expect(within(dialog).getByText('13,5 + 1,0 = 14,5 / 20')).toBeInTheDocument()
})

test('calcul en direct borné à l’échelle et à 0', async () => {
  await mount(makeStudent([20]))
  const dialog = await findDialog()

  type(dialog, '1')
  expect(within(dialog).getByText('20,0 + 1,0 = 20,0 / 20 (bornée à 20)')).toBeInTheDocument()
  type(dialog, '-20')
  expect(within(dialog).getByText('20,0 − 20,0 = 0,0 / 20')).toBeInTheDocument()
})

test('calcul en direct borné à 0', async () => {
  await mount(makeStudent([0]))
  const dialog = await findDialog()

  type(dialog, '-1')
  expect(within(dialog).getByText('0,0 − 1,0 = 0,0 / 20 (bornée à 0)')).toBeInTheDocument()
})

test('saisie hors du pas : message, aria-invalid, « Enregistrer » désactivé', async () => {
  await mount(makeStudent([13.5]))
  const dialog = await findDialog()

  type(dialog, '0,3')

  const input = field(dialog)
  expect(input).toHaveAttribute('aria-invalid', 'true')
  expect(input).toHaveAccessibleDescription('Saisissez un multiple de 0,5, entre −20 et 20.')
  expect(button(dialog, 'Enregistrer')).toBeDisabled()
  expect(within(dialog).queryByText(/ = /)).not.toBeInTheDocument()
})

test('boutons − et + au pas de 0,25', async () => {
  await mount(makeStudent([13.5]), 0.25)
  const dialog = await findDialog()

  fireEvent.click(button(dialog, 'Ajouter un pas'))
  fireEvent.click(button(dialog, 'Ajouter un pas'))
  expect(field(dialog)).toHaveValue('0,5')

  type(dialog, 'abc')
  fireEvent.click(button(dialog, 'Retirer un pas'))
  expect(field(dialog)).toHaveValue('-0,25')
})

test('double-clic sur « Enregistrer » : une seule écriture, aucune alerte (Review Focus 1)', async () => {
  await mount(makeStudent([13.5]))
  const dialog = await findDialog()
  type(dialog, '1')
  const put = vi.spyOn(db.sessions, 'put')

  fireEvent.click(button(dialog, 'Enregistrer'))
  // Le second clic ne part jamais : ignoré par la garde du hook, il serait pris pour un échec.
  expect(button(dialog, 'Enregistrer')).toBeDisabled()
  expect(button(dialog, 'Annuler')).toBeDisabled()
  fireEvent.click(button(dialog, 'Enregistrer'))

  await dialogClosed()
  expect(put).toHaveBeenCalledTimes(1)
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  expect((await stored()).student.adjustment).toEqual({ value: 1 })
})

test('double-clic sur « Annuler » en fin de passage : une seule écriture, aucune alerte', async () => {
  await mount(makeStudent([13.5]))
  const dialog = await findDialog()
  const put = vi.spyOn(db.sessions, 'put')

  fireEvent.click(button(dialog, 'Annuler'))
  expect(button(dialog, 'Annuler')).toBeDisabled()
  expect(button(dialog, 'Enregistrer')).toBeDisabled()
  fireEvent.click(button(dialog, 'Annuler'))

  await dialogClosed()
  expect(put).toHaveBeenCalledTimes(1)
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
})

/**
 * Rafale d'Échap, un par tour de boucle, tant que la popup est là : l'un d'eux tombe après la fin
 * de l'écriture, avant que la liveQuery ne ferme la popup.
 */
function escapeBurst(dialog: HTMLElement, remaining: number): void {
  if (remaining === 0 || !document.contains(dialog)) return
  fireEvent.keyDown(dialog, { key: 'Escape' })
  setImmediate(() => escapeBurst(dialog, remaining - 1))
}

test('Échap juste après un enregistrement réussi en fin de passage : pas de seconde écriture', async () => {
  await mount(makeStudent([13.5]))
  const dialog = await findDialog()
  type(dialog, '1')
  const realPut = db.sessions.put.bind(db.sessions)
  const put = vi.spyOn(db.sessions, 'put').mockImplementation((...args) =>
    realPut(...args).then((key) => {
      setImmediate(() => escapeBurst(dialog, 300))
      return key
    }),
  )

  fireEvent.click(button(dialog, 'Enregistrer'))

  await dialogClosed()
  expect(put).toHaveBeenCalledTimes(1)
  expect((await stored()).student.adjustment).toEqual({ value: 1 })
})

test('écriture en échec : popup ouverte avec le message d’erreur', async () => {
  await mount(makeStudent([13.5]))
  const dialog = await findDialog()
  vi.spyOn(db.sessions, 'put').mockRejectedValueOnce(new Error('disque plein'))

  fireEvent.click(button(dialog, 'Enregistrer'))

  expect(await within(dialog).findByRole('alert')).toHaveTextContent("L'enregistrement a échoué")
  expect(screen.getByRole('dialog', { name: 'Ajuster la note' })).toBeInTheDocument()
  expect((await stored()).student.finalRevealedAt).toBeUndefined()
})

test('réinitialiser un étudiant révélé puis le refaire passer rouvre la popup (Review Focus 2)', async () => {
  await mount(makeStudent([2], { finalRevealedAt: REVEALED }))
  await screen.findByRole('heading', { name: 'Passage terminé' })

  fireEvent.click(screen.getByRole('button', { name: 'Réinitialiser l’étudiant' }))
  const confirm = await screen.findByRole('alertdialog')
  fireEvent.click(within(confirm).getByRole('button', { name: 'Réinitialiser' }))

  fireEvent.click(await categoryButton('A'))
  fireEvent.click(await screen.findByRole('button', { name: 'Noter 3' }))

  expect(await findDialog()).toBeInTheDocument()
  expect((await stored()).student.finalRevealedAt).toBeUndefined()
})
