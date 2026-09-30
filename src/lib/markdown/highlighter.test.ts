import { describe, expect, test, vi } from 'vitest'
import type { TokensResult } from 'shiki/core'
import {
  createHighlightLoader,
  highlight,
  parseCssVariables,
  type HighlighterLike,
  type LanguageCatalog,
} from './highlighter'

function grammarModule(name: string) {
  return { default: [{ name, scopeName: `source.${name}`, patterns: [], repository: {} }] }
}

// Un module de grammaire est un singleton ES : `py` et `python` renvoient le même objet.
const phpModule = grammarModule('php')
const pythonModule = grammarModule('python')
const catalog: LanguageCatalog = {
  php: () => phpModule,
  python: () => pythonModule,
  py: () => pythonModule,
}
const noLanguages = () => Promise.resolve(catalog)

function fakeHighlighter(): HighlighterLike {
  const result: TokensResult = {
    tokens: [
      [
        {
          content: 'echo',
          offset: 0,
          htmlStyle: { '--shiki-light': '#111', '--shiki-dark': '#eee' },
        },
      ],
    ],
    rootStyle: '--shiki-light-bg:#fff;--shiki-dark-bg:#000',
  }
  return {
    loadLanguage: vi.fn<() => Promise<void>>(() => Promise.resolve()),
    codeToTokens: vi.fn<() => TokensResult>(() => result),
  }
}

describe('parseCssVariables', () => {
  test('ne garde que les variables CSS d’une chaîne de style', () => {
    expect(parseCssVariables('--shiki-light:#fff;color:red;--shiki-dark-bg:#000')).toStrictEqual({
      '--shiki-light': '#fff',
      '--shiki-dark-bg': '#000',
    })
  })

  test('chaîne vide, false ou undefined → objet vide', () => {
    expect(parseCssVariables('')).toStrictEqual({})
    expect(parseCssVariables(false)).toStrictEqual({})
    expect(parseCssVariables(undefined)).toStrictEqual({})
  })
})

describe('createHighlightLoader', () => {
  test('le highlighter est créé une fois et le langage chargé une fois, même en parallèle', async () => {
    const core = fakeHighlighter()
    const loadCore = vi.fn<() => Promise<HighlighterLike>>(() => Promise.resolve(core))
    const run = createHighlightLoader(loadCore, noLanguages)

    await Promise.all([run('echo', 'php'), run('echo', 'php')])
    await run('echo', 'php')

    expect(loadCore).toHaveBeenCalledTimes(1)
    expect(core.loadLanguage).toHaveBeenCalledTimes(1)
  })

  test('renvoie les lignes avec offsets et variables, et le fond de rootStyle', async () => {
    const run = createHighlightLoader(() => Promise.resolve(fakeHighlighter()), noLanguages)

    await expect(run('echo', 'php')).resolves.toStrictEqual({
      lines: [
        {
          offset: 0,
          tokens: [
            {
              offset: 0,
              content: 'echo',
              style: { '--shiki-light': '#111', '--shiki-dark': '#eee' },
            },
          ],
        },
      ],
      rootStyle: { '--shiki-light-bg': '#fff', '--shiki-dark-bg': '#000' },
    })
  })

  test('un échec de création renvoie null, puis un nouvel appel réessaie', async () => {
    let attempt = 0
    const loadCore = vi.fn<() => Promise<HighlighterLike>>(() => {
      attempt += 1
      return attempt === 1
        ? Promise.reject(new Error('chunk introuvable'))
        : Promise.resolve(fakeHighlighter())
    })
    const run = createHighlightLoader(loadCore, noLanguages)

    await expect(run('echo', 'php')).resolves.toBeNull()
    await expect(run('echo', 'php')).resolves.not.toBeNull()
    expect(loadCore).toHaveBeenCalledTimes(2)
  })

  test('un échec de chargement du langage renvoie null, puis un nouvel appel réessaie', async () => {
    const core = fakeHighlighter()
    let attempt = 0
    core.loadLanguage = vi.fn<() => Promise<void>>(() => {
      attempt += 1
      return attempt === 1 ? Promise.reject(new Error('chunk introuvable')) : Promise.resolve()
    })
    const run = createHighlightLoader(() => Promise.resolve(core), noLanguages)

    await expect(run('echo', 'php')).resolves.toBeNull()
    await expect(run('echo', 'php')).resolves.not.toBeNull()
    expect(core.loadLanguage).toHaveBeenCalledTimes(2)
  })
})

describe('createHighlightLoader (catalogue)', () => {
  test('le catalogue est chargé une seule fois pour deux appels', async () => {
    const loadCatalog = vi.fn<() => Promise<LanguageCatalog>>(noLanguages)
    const run = createHighlightLoader(() => Promise.resolve(fakeHighlighter()), loadCatalog)

    await run('echo', 'php')
    await run('echo', 'php')

    expect(loadCatalog).toHaveBeenCalledTimes(1)
  })

  test('un échec du catalogue renvoie null, puis un nouvel appel réessaie', async () => {
    let attempt = 0
    const loadCatalog = vi.fn<() => Promise<LanguageCatalog>>(() => {
      attempt += 1
      return attempt === 1 ? Promise.reject(new Error('chunk introuvable')) : noLanguages()
    })
    const run = createHighlightLoader(() => Promise.resolve(fakeHighlighter()), loadCatalog)

    await expect(run('echo', 'php')).resolves.toBeNull()
    await expect(run('echo', 'php')).resolves.not.toBeNull()
    expect(loadCatalog).toHaveBeenCalledTimes(2)
  })

  test('un langage inconnu renvoie null sans charger de grammaire', async () => {
    const core = fakeHighlighter()
    const run = createHighlightLoader(() => Promise.resolve(core), noLanguages)

    await expect(run('x', 'pyhton')).resolves.toBeNull()
    await expect(run('x', 'toString')).resolves.toBeNull()
    expect(core.loadLanguage).not.toHaveBeenCalled()
  })

  test.each(['text', 'txt', 'plain', 'plaintext', 'TEXT'])(
    'le pseudo-langage %s renvoie null sans charger le catalogue',
    async (lang) => {
      const loadCatalog = vi.fn<() => Promise<LanguageCatalog>>(noLanguages)
      const core = fakeHighlighter()
      const run = createHighlightLoader(() => Promise.resolve(core), loadCatalog)

      await expect(run('x', lang)).resolves.toBeNull()
      expect(loadCatalog).not.toHaveBeenCalled()
      expect(core.loadLanguage).not.toHaveBeenCalled()
    },
  )

  test('py puis python ne chargent qu’une seule grammaire', async () => {
    const core = fakeHighlighter()
    const run = createHighlightLoader(() => Promise.resolve(core), noLanguages)

    await run('x = 1', 'py')
    await run('x = 1', 'python')

    expect(core.loadLanguage).toHaveBeenCalledTimes(1)
  })

  test('PHP est normalisé en php', async () => {
    const core = fakeHighlighter()
    const run = createHighlightLoader(() => Promise.resolve(core), noLanguages)

    await expect(run('echo', 'PHP')).resolves.not.toBeNull()
    expect(core.codeToTokens).toHaveBeenCalledWith('echo', expect.objectContaining({ lang: 'php' }))
  })
})

describe('highlight (instance réelle, Shiki + moteur JavaScript)', () => {
  test('colore un extrait php avec les deux thèmes', async () => {
    const result = await highlight('<?php echo "bonjour";', 'php')

    expect(result).not.toBeNull()
    const tokens = result?.lines.flatMap((line) => line.tokens) ?? []
    expect(tokens.length).toBeGreaterThan(1)
    expect(tokens.map((token) => token.content).join('')).toBe('<?php echo "bonjour";')
    expect(tokens[0]?.style).toHaveProperty('--shiki-light')
    expect(tokens[0]?.style).toHaveProperty('--shiki-dark')
    expect(result?.rootStyle).toHaveProperty('--shiki-light-bg')
    expect(result?.rootStyle).toHaveProperty('--shiki-dark-bg')
  }, 15_000)

  test.each([
    ['python', 'def f(x):\n    return x + 1\n'],
    ['yaml', 'a:\n  - b: 1\n'],
  ])(
    'colore un extrait %s',
    async (lang, code) => {
      const result = await highlight(code, lang)

      const lines = result?.lines.filter((line) => line.tokens.length > 0) ?? []
      expect(lines.length).toBeGreaterThan(0)
      expect(lines[0]?.tokens[0]?.style).toHaveProperty('--shiki-light')
    },
    15_000,
  )
})
