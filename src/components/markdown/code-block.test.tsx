import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'
import css from '@/index.css?raw'
import type { Highlight, HighlightedCode } from '@/lib/markdown/highlighter'
import { CodeBlock } from './code-block'

function highlighted(code: string): HighlightedCode {
  return {
    lines: [
      {
        offset: 0,
        tokens: [
          { offset: 0, content: code, style: { '--shiki-light': '#111', '--shiki-dark': '#eee' } },
        ],
      },
    ],
    rootStyle: { '--shiki-light-bg': '#fff', '--shiki-dark-bg': '#000' },
  }
}

function noop() {}

function deferred<T>() {
  let resolve: (value: T) => void = noop
  const promise = new Promise<T>((settle) => {
    resolve = settle
  })
  return { promise, resolve }
}

describe('CodeBlock', () => {
  test('un bloc php passe du texte brut aux spans colorés', async () => {
    const highlight = vi.fn<Highlight>((code) => Promise.resolve(highlighted(code)))
    const { container } = render(<CodeBlock code="echo 1;" lang="php" highlight={highlight} />)

    expect(container.querySelector('pre')).toHaveAttribute('data-highlighted', 'false')
    await waitFor(() => {
      expect(container.querySelector('pre')).toHaveAttribute('data-highlighted', 'true')
    })
    const pre = container.querySelector('pre')
    expect(pre).toHaveClass('shiki')
    expect(pre?.style.getPropertyValue('--shiki-dark-bg')).toBe('#000')
    const token = screen.getByText('echo 1;')
    expect(token.style.getPropertyValue('--shiki-light')).toBe('#111')
    expect(token.style.getPropertyValue('--shiki-dark')).toBe('#eee')
    expect(highlight).toHaveBeenCalledWith('echo 1;', 'php')
  })

  test('un langage inconnu ou absent reste en texte brut sans appeler highlight', () => {
    const highlight = vi.fn<Highlight>(() => Promise.resolve(null))
    const { container, rerender } = render(
      <CodeBlock code="MOVE A TO B" lang="cobol" highlight={highlight} />,
    )
    rerender(<CodeBlock code="texte" highlight={highlight} />)

    expect(container.querySelector('pre')).toHaveAttribute('data-highlighted', 'false')
    expect(screen.getByText('texte')).toBeInTheDocument()
    expect(highlight).not.toHaveBeenCalled()
  })

  test('un échec de coloration (null) laisse le texte brut', async () => {
    const highlight = vi.fn<Highlight>(() => Promise.resolve(null))
    const { container } = render(<CodeBlock code="echo 1;" lang="php" highlight={highlight} />)

    await waitFor(() => {
      expect(highlight).toHaveBeenCalled()
    })
    expect(container.querySelector('pre')).toHaveAttribute('data-highlighted', 'false')
    expect(screen.getByText('echo 1;')).toBeInTheDocument()
  })

  test('un changement de code retokenise, et le code affiché n’est jamais l’ancien', async () => {
    const highlight = vi.fn<Highlight>((code) => Promise.resolve(highlighted(code)))
    const { rerender } = render(<CodeBlock code="echo 1;" lang="php" highlight={highlight} />)
    await screen.findByText('echo 1;')
    rerender(<CodeBlock code="echo 2;" lang="php" highlight={highlight} />)

    expect(screen.queryByText('echo 1;')).not.toBeInTheDocument()
    await waitFor(() => {
      expect(highlight).toHaveBeenLastCalledWith('echo 2;', 'php')
    })
    expect(screen.getByText('echo 2;')).toBeInTheDocument()
  })

  test('une réponse périmée, arrivée après la nouvelle, est ignorée', async () => {
    const first = deferred<HighlightedCode | null>()
    const highlight = vi.fn<Highlight>((code) =>
      code === 'ancien' ? first.promise : Promise.resolve(highlighted(code)),
    )
    const { container, rerender } = render(
      <CodeBlock code="ancien" lang="php" highlight={highlight} />,
    )
    rerender(<CodeBlock code="nouveau" lang="php" highlight={highlight} />)
    await waitFor(() => {
      expect(container.querySelector('pre')).toHaveAttribute('data-highlighted', 'true')
    })

    first.resolve(highlighted('ancien'))
    await first.promise

    expect(screen.queryByText('ancien')).not.toBeInTheDocument()
    expect(screen.getByText('nouveau')).toBeInTheDocument()
  })

  test('du HTML dans un bloc coloré reste du texte (vraie coloration html)', async () => {
    const { container } = render(<CodeBlock code={'<script>alert(1)</script>'} lang="html" />)

    await waitFor(
      () => {
        expect(container.querySelector('pre')).toHaveAttribute('data-highlighted', 'true')
      },
      { timeout: 15_000 },
    )
    expect(container.querySelector('script')).toBeNull()
    expect(container.querySelector('code')).toHaveTextContent('<script>alert(1)</script>')
  }, 20_000)
})

describe('double thème Shiki (src/index.css)', () => {
  test('les règles claire et sombre choisissent la variable du token et du fond', () => {
    const compact = css.replaceAll(/\s+/g, ' ')
    expect(compact).toContain('.shiki { background-color: var(--shiki-light-bg); }')
    expect(compact).toContain('.shiki span { color: var(--shiki-light); }')
    expect(compact).toContain('.dark .shiki { background-color: var(--shiki-dark-bg); }')
    expect(compact).toContain('.dark .shiki span { color: var(--shiki-dark); }')
  })
})
