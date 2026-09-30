import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { exportWorkbook } from '@/components/export/export-workbook'
import { useWorkbookExport } from '@/components/export/use-workbook-export'
import { makeSession } from '@/testing/session-fixtures'

vi.mock('@/components/export/export-workbook')

const session = makeSession()

let resolve: () => void = () => {}

function deferred(): Promise<void> {
  return new Promise<void>((done) => {
    resolve = done
  })
}

beforeEach(() => {
  vi.mocked(exportWorkbook).mockReset()
})

describe('useWorkbookExport', () => {
  it('un seul export pour deux appels dans le même tick', async () => {
    const promise = deferred()
    vi.mocked(exportWorkbook).mockReturnValue(promise)
    const { result } = renderHook(() => useWorkbookExport('fr'))

    act(() => {
      void result.current.run(session)
      void result.current.run(session)
    })
    expect(exportWorkbook).toHaveBeenCalledTimes(1)
    expect(result.current.state).toBe('busy')

    await act(async () => resolve())
    expect(result.current.state).toBe('idle')
  })

  it('échec → failed, puis nouvel essai repasse par busy', async () => {
    vi.mocked(exportWorkbook).mockRejectedValueOnce(new Error('boom'))
    const { result } = renderHook(() => useWorkbookExport('fr'))

    await act(async () => result.current.run(session))
    expect(result.current.state).toBe('failed')

    const promise = deferred()
    vi.mocked(exportWorkbook).mockReturnValueOnce(promise)
    act(() => {
      void result.current.run(session)
    })
    expect(result.current.state).toBe('busy')
    await act(async () => resolve())
    expect(result.current.state).toBe('idle')
    expect(exportWorkbook).toHaveBeenCalledTimes(2)
  })

  it('appelle exportWorkbook avec la session et la locale', async () => {
    vi.mocked(exportWorkbook).mockResolvedValue(undefined)
    const { result } = renderHook(() => useWorkbookExport('en'))
    await act(async () => result.current.run(session))
    expect(exportWorkbook).toHaveBeenCalledWith(session, 'en')
  })
})
