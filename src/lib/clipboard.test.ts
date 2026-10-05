import { afterEach, describe, expect, test, vi } from 'vitest'
import { copyText } from './clipboard'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('copyText', () => {
  test('copie le texte et rend true', async () => {
    const writeText = vi.fn<(text: string) => Promise<void>>().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    await expect(copyText('bonjour')).resolves.toBe(true)
    expect(writeText).toHaveBeenCalledWith('bonjour')
  })

  test('API absente : false', async () => {
    vi.stubGlobal('navigator', {})
    await expect(copyText('x')).resolves.toBe(false)
  })

  test('rejet : false, sans exception', async () => {
    vi.stubGlobal('navigator', {
      clipboard: {
        writeText: vi.fn<(text: string) => Promise<void>>().mockRejectedValue(new Error('refusé')),
      },
    })
    await expect(copyText('x')).resolves.toBe(false)
  })
})
