import ReactMarkdown, { type Components, type ExtraProps } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { CodeBlock } from '@/components/markdown/code-block'
import { cn } from '@/lib/utils'

type HastElement = NonNullable<ExtraProps['node']>
type HastChild = HastElement['children'][number]

function textOf(node: HastChild): string {
  if (node.type === 'text') return node.value
  if (node.type === 'element') return node.children.map((child) => textOf(child)).join('')
  return ''
}

function languageOf(code: HastElement): string | undefined {
  const className = code.properties.className
  if (!Array.isArray(className)) return undefined
  const languageClass = className.map(String).find((name) => name.startsWith('language-'))
  return languageClass?.slice('language-'.length)
}

const components: Components = {
  a: ({ node: _node, children, ...props }) => (
    <a {...props} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  ),
  img: ({ node: _node, alt, ...props }) => <img {...props} alt={alt ?? ''} loading="lazy" />,
  // Un bloc de code est un `<code>` seul enfant d'un `<pre>` : il part vers CodeBlock. Le code
  // inline (`<code>` hors `<pre>`) garde le rendu par défaut, stylé par `prose`.
  pre: ({ node, children }) => {
    const code = node?.children[0]
    if (code?.type !== 'element' || code.tagName !== 'code') return <pre>{children}</pre>
    return <CodeBlock code={textOf(code).replace(/\n$/, '')} lang={languageOf(code)} />
  },
}

/**
 * Markdown d'un énoncé ou d'éléments de réponse (D27). Pas de `rehype-raw` : le HTML brut est affiché
 * comme du texte. L'`urlTransform` par défaut de react-markdown neutralise `javascript:`. La taille
 * `projection` (`prose-2xl`) est provisoire, à caler sur un vrai écran en F14 (D62).
 */
export function Markdown({
  source,
  size = 'default',
  className,
}: Readonly<{ source: string; size?: 'default' | 'projection'; className?: string }>) {
  return (
    <div className={cn('prose max-w-none', size === 'projection' && 'prose-2xl', className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {source}
      </ReactMarkdown>
    </div>
  )
}
