import { describe, expect, test, vi } from 'vitest'
import type { TokensResult } from 'shiki/core'
import {
  createHighlightLoader,
  highlight,
  parseCssVariables,
  resolveLanguage,
  type HighlighterLike,
  type SupportedLanguage,
} from './highlighter'

const noLanguages = {
  php: () => [],
  sql: () => [],
  html: () => [],
  javascript: () => [],
  json: () => [],
  bash: () => [],
} satisfies Record<SupportedLanguage, () => []>

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

describe('resolveLanguage', () => {
  test.each([
    ['php', 'php'],
    ['PHP', 'php'],
    ['js', 'javascript'],
    ['JS', 'javascript'],
    ['javascript', 'javascript'],
    ['sh', 'bash'],
    ['shell', 'bash'],
    ['bash', 'bash'],
    ['sql', 'sql'],
    ['html', 'html'],
    ['json', 'json'],
  ])('%s → %s', (input, expected) => {
    expect(resolveLanguage(input)).toBe(expected)
  })

  test.each([['cobol'], [''], [undefined]])('%s → null', (input) => {
    expect(resolveLanguage(input)).toBeNull()
  })
})

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
})
