import type { HighlighterCore, LanguageInput, TokensResult } from 'shiki/core'
import { isPlainLanguage, normalizeLanguage } from '@/lib/markdown/languages'

export type CssVariables = Readonly<Record<`--${string}`, string>>
export type HighlightedToken = Readonly<{ offset: number; content: string; style: CssVariables }>
export type HighlightedLine = Readonly<{ offset: number; tokens: readonly HighlightedToken[] }>
export type HighlightedCode = Readonly<{
  lines: readonly HighlightedLine[]
  rootStyle: CssVariables
}>
export type Highlight = (code: string, lang: string) => Promise<HighlightedCode | null>
export type LanguageCatalog = Readonly<Record<string, () => LanguageInput>>
export type HighlighterLike = Pick<HighlighterCore, 'loadLanguage' | 'codeToTokens'>

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
 * Fabrique de la fonction de coloration, sur le modèle de `createIconLoader` (D37) : le highlighter,
 * le catalogue de grammaires et chaque grammaire sont chargés une seule fois, et les promesses sont
 * gardées dans la fermeture pour rester testables avec des imports injectés, sans `vi.mock`. Un
 * échec vide le cache fautif, et l'appel suivant (donc le montage suivant d'un `CodeBlock`)
 * réessaie. L'appel en échec, un pseudo-langage ou un langage inconnu renvoient `null` : le bloc
 * reste en texte brut.
 *
 * Le cache des grammaires est indexé par le module importé, pas par le nom demandé : un alias
 * (`py`) et son identifiant (`python`) importent le même module ES, donc une seule grammaire.
 */
export function createHighlightLoader(
  loadCore: () => Promise<HighlighterLike>,
  loadCatalog: () => Promise<LanguageCatalog>,
): Highlight {
  let core: Promise<HighlighterLike> | undefined
  let catalog: Promise<LanguageCatalog> | undefined
  const loadedLanguages = new Map<object, Promise<void>>()

  function getCore(): Promise<HighlighterLike> {
    core ??= loadCore().catch((error: unknown) => {
      core = undefined
      throw error
    })
    return core
  }

  function getCatalog(): Promise<LanguageCatalog> {
    catalog ??= loadCatalog().catch((error: unknown) => {
      catalog = undefined
      throw error
    })
    return catalog
  }

  async function loadLanguage(
    highlighter: HighlighterLike,
    grammar: () => LanguageInput,
  ): Promise<void> {
    const input = await grammar()
    let loading = loadedLanguages.get(input)
    if (loading === undefined) {
      loading = highlighter.loadLanguage(input).catch((error: unknown) => {
        loadedLanguages.delete(input)
        throw error
      })
      loadedLanguages.set(input, loading)
    }
    return loading
  }

  return async function highlight(code, lang) {
    const language = normalizeLanguage(lang)
    if (isPlainLanguage(language)) return null
    try {
      const languages = await getCatalog()
      if (!Object.hasOwn(languages, language)) return null
      const grammar = languages[language]
      if (grammar === undefined) return null
      const highlighter = await getCore()
      await loadLanguage(highlighter, grammar)
      return toHighlightedCode(
        highlighter.codeToTokens(code, {
          lang: language,
          themes: { light: 'github-light', dark: 'github-dark' },
          defaultColor: false,
        }),
      )
    } catch {
      return null
    }
  }
}

// Catalogue complet de Shiki (identifiants et alias), chargé par `import()` : il reste dans le chunk
// du highlighter, hors du bundle initial, et chaque grammaire n'est téléchargée qu'à la demande.
// Sous-chemins `shiki/...` : avec pnpm, `@shikijs/*` n'est pas résoluble depuis le projet.
async function loadShikiCatalog(): Promise<LanguageCatalog> {
  const { bundledLanguages } = await import('shiki/langs')
  return bundledLanguages
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
}, loadShikiCatalog)
