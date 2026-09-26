import type { HighlighterCore, LanguageInput, TokensResult } from 'shiki/core'

export type SupportedLanguage = 'php' | 'sql' | 'html' | 'javascript' | 'json' | 'bash'
export type CssVariables = Readonly<Record<`--${string}`, string>>
export type HighlightedToken = Readonly<{ offset: number; content: string; style: CssVariables }>
export type HighlightedLine = Readonly<{ offset: number; tokens: readonly HighlightedToken[] }>
export type HighlightedCode = Readonly<{
  lines: readonly HighlightedLine[]
  rootStyle: CssVariables
}>
export type Highlight = (code: string, lang: SupportedLanguage) => Promise<HighlightedCode | null>
export type HighlighterLike = Pick<HighlighterCore, 'loadLanguage' | 'codeToTokens'>

const LANGUAGE_ALIASES: Readonly<Record<string, SupportedLanguage>> = {
  php: 'php',
  sql: 'sql',
  html: 'html',
  javascript: 'javascript',
  js: 'javascript',
  json: 'json',
  bash: 'bash',
  sh: 'bash',
  shell: 'bash',
}

/** Langage d'un bloc de code (`language-xxx` sans le préfixe) → langage chargé, ou `null` : texte brut. */
export function resolveLanguage(lang: string | undefined): SupportedLanguage | null {
  if (lang === undefined) return null
  const key = lang.toLowerCase()
  return Object.hasOwn(LANGUAGE_ALIASES, key) ? (LANGUAGE_ALIASES[key] ?? null) : null
}

function isCssVariable(name: string): name is `--${string}` {
  return name.startsWith('--')
}

function cssVariables(entries: Iterable<readonly [string, string]>): CssVariables {
  const variables: Record<`--${string}`, string> = {}
  for (const [name, value] of entries) {
    if (isCssVariable(name)) variables[name] = value
  }
  return variables
}

/** `rootStyle` de Shiki est une chaîne (`--shiki-light:#fff;…`) : on n'en garde que les variables. */
export function parseCssVariables(style: string | false | undefined): CssVariables {
  if (!style) return {}
  return cssVariables(
    style.split(';').flatMap((declaration) => {
      const separator = declaration.indexOf(':')
      if (separator === -1) return []
      const pair: [string, string] = [
        declaration.slice(0, separator).trim(),
        declaration.slice(separator + 1).trim(),
      ]
      return [pair]
    }),
  )
}

function toHighlightedCode(result: TokensResult): HighlightedCode {
  let lineOffset = 0
  const lines = result.tokens.map((line) => {
    const offset = lineOffset
    lineOffset += line.reduce((length, token) => length + token.content.length, 0) + 1
    return {
      offset,
      tokens: line.map((token) => ({
        offset: token.offset,
        content: token.content,
        style: cssVariables(Object.entries(token.htmlStyle ?? {})),
      })),
    }
  })
  return { lines, rootStyle: parseCssVariables(result.rootStyle) }
}

/**
 * Fabrique de la fonction de coloration, sur le modèle de `createIconLoader` (D37) : le highlighter
 * et chaque langage sont chargés une seule fois, et les promesses sont gardées dans la fermeture
 * pour rester testables avec des imports injectés, sans `vi.mock`. Un échec vide le cache fautif,
 * et l'appel suivant (donc le montage suivant d'un `CodeBlock`) réessaie. L'appel en échec renvoie
 * `null` : le bloc reste en texte brut.
 */
export function createHighlightLoader(
  loadCore: () => Promise<HighlighterLike>,
  languages: Readonly<Record<SupportedLanguage, () => LanguageInput>>,
): Highlight {
  let core: Promise<HighlighterLike> | undefined
  const loadedLanguages = new Map<SupportedLanguage, Promise<void>>()

  function getCore(): Promise<HighlighterLike> {
    core ??= loadCore().catch((error: unknown) => {
      core = undefined
      throw error
    })
    return core
  }

  function loadLanguage(highlighter: HighlighterLike, lang: SupportedLanguage): Promise<void> {
    let loading = loadedLanguages.get(lang)
    if (loading === undefined) {
      loading = highlighter.loadLanguage(languages[lang]()).catch((error: unknown) => {
        loadedLanguages.delete(lang)
        throw error
      })
      loadedLanguages.set(lang, loading)
    }
    return loading
  }

  return async function highlight(code, lang) {
    try {
      const highlighter = await getCore()
      await loadLanguage(highlighter, lang)
      return toHighlightedCode(
        highlighter.codeToTokens(code, {
          lang,
          themes: { light: 'github-light', dark: 'github-dark' },
          defaultColor: false,
        }),
      )
    } catch {
      return null
    }
  }
}

// Sous-chemins `shiki/langs/*.mjs` et `shiki/themes/*.mjs` : avec pnpm, `@shikijs/langs` n'est pas
// résoluble depuis le projet. Tout passe par `import()` : Shiki reste hors du bundle initial.
const LANGUAGE_IMPORTS: Readonly<Record<SupportedLanguage, () => LanguageInput>> = {
  php: () => import('shiki/langs/php.mjs'),
  sql: () => import('shiki/langs/sql.mjs'),
  html: () => import('shiki/langs/html.mjs'),
  javascript: () => import('shiki/langs/javascript.mjs'),
  json: () => import('shiki/langs/json.mjs'),
  bash: () => import('shiki/langs/bash.mjs'),
}

export const highlight: Highlight = createHighlightLoader(async () => {
  const [{ createHighlighterCore }, { createJavaScriptRegexEngine }] = await Promise.all([
    import('shiki/core'),
    import('shiki/engine/javascript'),
  ])
  return createHighlighterCore({
    themes: [import('shiki/themes/github-light.mjs'), import('shiki/themes/github-dark.mjs')],
    langs: [],
    engine: createJavaScriptRegexEngine(),
  })
}, LANGUAGE_IMPORTS)
