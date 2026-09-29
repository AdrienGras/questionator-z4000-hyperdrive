import 'fake-indexeddb/auto'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, expect, test } from 'vitest'
import type { NormalizedCategory } from '@/domain/config/normalize'
import type { ParsedConfig } from '@/domain/config/schema'
import { db } from '@/lib/db/db'
import { putSession } from '@/lib/db/sessions'
import { categoryButton } from '@/testing/passage-assertions'
import { renderAt } from '@/testing/render-at'
import { makeSession } from '@/testing/session-fixtures'
import { makeConfig, makeStudent, type AttemptSpec } from '@/testing/student-fixtures'

/** Catégorie `a` à 3 questions : la fixture par défaut n'en a qu'une, `attempt-2` n'y aurait rien. */
const category: NormalizedCategory = {
  id: 'a',
  label: 'A',
  scale: [0, 1, 2],
  order: 1,
  questions: ['a-1', 'a-2', 'a-3'].map((id) => ({ id, title: id, tags: [], prompt: id })),
}

beforeEach(async () => {
  await db.sessions.clear()
})

async function openPassage(
  attempts: AttemptSpec[] = ['pending'],
  skips: ParsedConfig['skips'] = { enabled: true, maxPerStudent: 1 },
): Promise<void> {
  const config = {
    ...makeConfig({ questionsPerStudent: 2 }, undefined, skips),
    categories: [category],
  }
  await putSession(
    makeSession({ config, students: [makeStudent(attempts)], activeStudentId: 'student-1' }),
  )
  renderAt('/session/session-1')
  await categoryButton('A')
}

async function storedAttempt(id = 'attempt-1') {
  const session = await db.sessions.get('session-1')
  return session?.students[0]?.attempts.find((attempt) => attempt.id === id)
}

function skipButton(): HTMLElement {
  return screen.getByRole('button', { name: /^Passer la question/ })
}

test('bouton absent si les skips sont désactivés', async () => {
  await openPassage(['pending'], { enabled: false })

  expect(screen.queryByRole('button', { name: /^Passer la question/ })).not.toBeInTheDocument()
})

test('bouton absent sans question en cours', async () => {
  await openPassage([])

  expect(screen.queryByRole('button', { name: /^Passer la question/ })).not.toBeInTheDocument()
})

test('libellé avec le nombre de passes restantes', async () => {
  await openPassage(['pending'], { enabled: true, maxPerStudent: 2 })

  expect(skipButton()).toHaveAccessibleName('Passer la question (2 passes restantes)')
  expect(skipButton()).not.toHaveAttribute('aria-disabled')
})

test('quota atteint : aria-disabled avec motif, le clic n’ouvre rien', async () => {
  await openPassage([{ skipped: '' }, 'pending'])

  const button = skipButton()
  expect(button).toHaveAccessibleName('Passer la question (0 passe restante)')
  expect(button).toHaveAttribute('aria-disabled', 'true')
  expect(button).toHaveAccessibleDescription('Plus de passe disponible pour cet étudiant.')

  fireEvent.click(button)
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})

test('maxPerStudent = 0 : bouton désactivé dès le départ', async () => {
  await openPassage(['pending'], { enabled: true, maxPerStudent: 0 })

  expect(skipButton()).toHaveAttribute('aria-disabled', 'true')
})

test('motif prédéfini et champ libre s’excluent mutuellement', async () => {
  await openPassage(['pending'], {
    enabled: true,
    maxPerStudent: 1,
    reasons: ['Déjà vue', 'Hors programme'],
  })
  fireEvent.click(skipButton())

  const dialog = await screen.findByRole('dialog')
  const seen = within(dialog).getByRole('button', { name: 'Déjà vue' })
  const other = within(dialog).getByLabelText('Autre motif')

  fireEvent.click(seen)
  expect(seen).toHaveAttribute('aria-pressed', 'true')

  fireEvent.change(other, { target: { value: 'Énoncé ambigu' } })
  expect(seen).toHaveAttribute('aria-pressed', 'false')

  fireEvent.click(seen)
  expect(seen).toHaveAttribute('aria-pressed', 'true')
  expect(other).toHaveValue('')

  fireEvent.click(seen)
  expect(seen).toHaveAttribute('aria-pressed', 'false')
})

test('skip avec motif prédéfini : attempt skipped, grille réactivée', async () => {
  await openPassage(['pending'], {
    enabled: true,
    maxPerStudent: 1,
    reasons: ['Déjà vue'],
  })
  fireEvent.click(skipButton())
  const dialog = await screen.findByRole('dialog')
  fireEvent.click(within(dialog).getByRole('button', { name: 'Déjà vue' }))
  fireEvent.click(within(dialog).getByRole('button', { name: 'Passer' }))

  await waitFor(async () => {
    expect(await storedAttempt()).toMatchObject({ outcome: 'skipped', skipReason: 'Déjà vue' })
  })
  await waitFor(() => {
    expect(screen.queryByRole('button', { name: /^Passer la question/ })).not.toBeInTheDocument()
  })
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  expect(screen.getByText('Question 1 / 2')).toBeInTheDocument()
  expect(await categoryButton('A')).not.toBeDisabled()
})

test('skip avec motif libre, trimé', async () => {
  await openPassage()
  fireEvent.click(skipButton())
  const dialog = await screen.findByRole('dialog')
  fireEvent.change(within(dialog).getByLabelText('Autre motif'), {
    target: { value: '  Énoncé ambigu  ' },
  })
  fireEvent.click(within(dialog).getByRole('button', { name: 'Passer' }))

  await waitFor(async () => {
    expect(await storedAttempt()).toMatchObject({
      outcome: 'skipped',
      skipReason: 'Énoncé ambigu',
    })
  })
})

test('sans motif ni champ libre : simple confirmation, skipReason absent', async () => {
  await openPassage(['pending'], { enabled: true, maxPerStudent: 1, allowFreeText: false })
  fireEvent.click(skipButton())
  const dialog = await screen.findByRole('dialog')
  expect(within(dialog).queryByLabelText('Autre motif')).not.toBeInTheDocument()
  fireEvent.click(within(dialog).getByRole('button', { name: 'Passer' }))

  await waitFor(async () => {
    expect((await storedAttempt())?.outcome).toBe('skipped')
  })
  expect(await storedAttempt()).not.toHaveProperty('skipReason')
})

test('Annuler ferme sans rien écrire, et le motif repart de zéro', async () => {
  await openPassage(['pending'], { enabled: true, maxPerStudent: 1, reasons: ['Déjà vue'] })
  fireEvent.click(skipButton())
  let dialog = await screen.findByRole('dialog')
  fireEvent.click(within(dialog).getByRole('button', { name: 'Déjà vue' }))
  fireEvent.click(within(dialog).getByRole('button', { name: 'Annuler' }))

  await waitFor(() => {
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
  expect((await storedAttempt())?.outcome).toBe('pending')

  fireEvent.click(skipButton())
  dialog = await screen.findByRole('dialog')
  expect(within(dialog).getByRole('button', { name: 'Déjà vue' })).toHaveAttribute(
    'aria-pressed',
    'false',
  )
})
