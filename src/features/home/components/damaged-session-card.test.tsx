import 'fake-indexeddb/auto'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, test } from 'vitest'
import { db } from '@/lib/db/db'
import { renderAt } from '@/testing/render-at'
import { makeSession } from '@/testing/session-fixtures'

async function putRaw(record: object) {
  await db.table('sessions').put(record)
}

beforeEach(async () => {
  await db.sessions.clear()
})

describe('carte de session endommagée', () => {
  test('affiche le nom brut, le badge et seulement deux actions', async () => {
    await putRaw({ id: 'x', name: 'Oral cassé' })
    renderAt('/')
    expect(await screen.findByRole('heading', { name: 'Oral cassé' })).toBeInTheDocument()
    expect(screen.getByText('Endommagée')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Reprendre' })).not.toBeInTheDocument()
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Actions pour « Oral cassé »' }))
    const items = await screen.findAllByRole('menuitem')
    expect(items.map((item) => item.textContent)).toEqual(['Exporter un backup', 'Supprimer'])
  })

  test('sans nom lisible, le titre est l’identifiant', async () => {
    await putRaw({ id: 'x' })
    renderAt('/')
    expect(await screen.findByRole('heading', { name: 'x' })).toBeInTheDocument()
  })

  test('Supprimer ouvre le dialogue et supprime l’enregistrement', async () => {
    await putRaw({ id: 'x', name: 'Oral cassé' })
    renderAt('/')
    fireEvent.click(await screen.findByRole('button', { name: 'Actions pour « Oral cassé »' }))
    fireEvent.click(await screen.findByRole('menuitem', { name: 'Supprimer' }))
    const dialog = await screen.findByRole('alertdialog')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Supprimer' }))
    await waitFor(async () => expect(await db.sessions.get('x')).toBeUndefined())
  })

  test('la liste affiche une carte saine et une endommagée', async () => {
    await db.sessions.put(makeSession({ id: 'ok', name: 'Oral sain' }))
    await putRaw({ id: 'x', name: 'Oral cassé' })
    renderAt('/')
    expect(await screen.findByRole('heading', { name: 'Oral sain' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Oral cassé' })).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'Reprendre' })).toHaveLength(1)
  })
})
