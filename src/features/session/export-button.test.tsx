import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, expect, test, vi } from 'vitest'
import { ExportButton } from '@/features/session/components/export-button'
import { exportWorkbook } from '@/features/session/export-workbook'
import { makeSession } from '@/testing/session-fixtures'
import { makeUi } from '@/testing/make-ui'

vi.mock('@/features/session/export-workbook')

beforeEach(() => {
  vi.mocked(exportWorkbook).mockReset()
})

test('exporte la session dans la langue de l’écran', async () => {
  vi.mocked(exportWorkbook).mockResolvedValue()
  const session = makeSession()
  render(<ExportButton ui={makeUi('fr')} session={session} />)
  fireEvent.click(screen.getByRole('button', { name: 'Exporter en Excel' }))
  await waitFor(() => expect(exportWorkbook).toHaveBeenCalledWith(session, 'fr'))
  expect(await screen.findByRole('button', { name: 'Exporter en Excel' })).toBeEnabled()
  expect(screen.queryByRole('alert')).toBeNull()
})

test('désactive le bouton pendant l’export et ignore un second clic', async () => {
  let release: (() => void) | undefined
  vi.mocked(exportWorkbook).mockReturnValue(
    new Promise<void>((done) => {
      release = done
    }),
  )
  render(<ExportButton ui={makeUi('fr')} session={makeSession()} />)
  fireEvent.click(screen.getByRole('button', { name: 'Exporter en Excel' }))
  const busy = await screen.findByRole('button', { name: 'Export en cours…' })
  expect(busy).toBeDisabled()
  fireEvent.click(busy)
  expect(exportWorkbook).toHaveBeenCalledTimes(1)
  release?.()
  expect(await screen.findByRole('button', { name: 'Exporter en Excel' })).toBeEnabled()
})

test('affiche une alerte si l’export échoue et réactive le bouton', async () => {
  vi.mocked(exportWorkbook).mockRejectedValue(new Error('boom'))
  render(<ExportButton ui={makeUi('fr')} session={makeSession()} />)
  fireEvent.click(screen.getByRole('button', { name: 'Exporter en Excel' }))
  expect(await screen.findByRole('alert')).toHaveTextContent("L'export a échoué. Réessayez.")
  expect(screen.getByRole('button', { name: 'Exporter en Excel' })).toBeEnabled()
})

test('efface l’alerte au nouvel essai', async () => {
  vi.mocked(exportWorkbook).mockRejectedValueOnce(new Error('boom')).mockResolvedValue()
  render(<ExportButton ui={makeUi('fr')} session={makeSession()} />)
  fireEvent.click(screen.getByRole('button', { name: 'Exporter en Excel' }))
  await screen.findByRole('alert')
  fireEvent.click(screen.getByRole('button', { name: 'Exporter en Excel' }))
  await waitFor(() => expect(screen.queryByRole('alert')).toBeNull())
})

test('parle anglais avec une interface anglaise', async () => {
  vi.mocked(exportWorkbook).mockRejectedValue(new Error('boom'))
  const session = makeSession()
  render(<ExportButton ui={makeUi('en')} session={session} />)
  fireEvent.click(screen.getByRole('button', { name: 'Export to Excel' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Export failed. Try again.')
  expect(exportWorkbook).toHaveBeenCalledWith(session, 'en')
})

test('affiche « Exporting… » en anglais pendant l’export', async () => {
  vi.mocked(exportWorkbook).mockReturnValue(new Promise<void>(() => undefined))
  render(<ExportButton ui={makeUi('en')} session={makeSession()} />)
  fireEvent.click(screen.getByRole('button', { name: 'Export to Excel' }))
  expect(await screen.findByRole('button', { name: 'Exporting…' })).toBeDisabled()
})
