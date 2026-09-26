import { useEffect, useState, type CSSProperties } from 'react'
import {
  highlight as defaultHighlight,
  resolveLanguage,
  type CssVariables,
  type Highlight,
  type HighlightedCode,
} from '@/lib/markdown/highlighter'

type Result = Readonly<{ code: string; lang: string; highlighted: HighlightedCode }>

function styleOf(variables: CssVariables): CSSProperties & CssVariables {
  return { ...variables }
}

/**
 * Bloc de code : texte brut tout de suite, puis tokens Shiki rendus en `<span>` React, sans
 * `dangerouslySetInnerHTML`. Chaque token porte `--shiki-light` et `--shiki-dark`, et les règles
 * `.shiki` de `index.css` choisissent l'une ou l'autre selon `.dark` : la bascule de mode ne refait
 * aucun rendu. Langage inconnu ou coloration en échec : le texte brut reste (D27).
 */
export function CodeBlock({
  code,
  lang,
  highlight = defaultHighlight,
}: Readonly<{ code: string; lang?: string; highlight?: Highlight }>) {
  const language = resolveLanguage(lang)
  const [result, setResult] = useState<Result | null>(null)

  useEffect(() => {
    if (language === null) return () => {}
    let active = true
    void highlight(code, language).then((highlighted) => {
      if (active) setResult(highlighted === null ? null : { code, lang: language, highlighted })
    })
    return () => {
      active = false
    }
  }, [code, language, highlight])

  // Un résultat obtenu pour un autre code ou un autre langage n'est jamais affiché.
  const current = result?.code === code && result.lang === language ? result.highlighted : null

  if (current === null) {
    return (
      <pre data-highlighted="false">
        <code>{code}</code>
      </pre>
    )
  }
  return (
    <pre className="shiki" data-highlighted="true" style={styleOf(current.rootStyle)}>
      <code>
        {current.lines.map((line) => (
          <span key={line.offset} className="line">
            {line.tokens.map((token) => (
              <span key={token.offset} style={styleOf(token.style)}>
                {token.content}
              </span>
            ))}
            {'\n'}
          </span>
        ))}
      </code>
    </pre>
  )
}
