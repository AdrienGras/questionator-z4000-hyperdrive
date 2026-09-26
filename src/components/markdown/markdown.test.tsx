import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import { Markdown } from './markdown'

describe('Markdown', () => {
  test('une balise <script> est affichée comme du texte, sans élément script', () => {
    const { container } = render(<Markdown source={'Avant <script>alert(1)</script> après'} />)

    expect(container.querySelector('script')).toBeNull()
    expect(container).toHaveTextContent('<script>alert(1)</script>')
  })

  test('du HTML brut avec gestionnaire d’événement reste du texte', () => {
    const { container } = render(<Markdown source={'<img src=x onerror=alert(1)>'} />)

    expect(container.querySelector('img')).toBeNull()
    expect(container).toHaveTextContent('<img src=x onerror=alert(1)>')
  })

  test('un lien javascript: est neutralisé', () => {
    render(<Markdown source="[clic](javascript:alert(1))" />)

    expect(screen.getByText('clic').closest('a')?.getAttribute('href') ?? '').not.toMatch(
      /^javascript:/i,
    )
  })

  test('un lien s’ouvre dans un nouvel onglet, sans opener', () => {
    render(<Markdown source="[doc](https://example.org)" />)

    const link = screen.getByRole('link', { name: 'doc' })
    expect(link).toHaveAttribute('href', 'https://example.org')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  test('une image est chargée paresseusement et garde son alt', () => {
    render(<Markdown source="![schéma MVC](https://example.org/mvc.png)" />)

    const image = screen.getByRole('img', { name: 'schéma MVC' })
    expect(image).toHaveAttribute('loading', 'lazy')
    expect(image).toHaveAttribute('src', 'https://example.org/mvc.png')
  })

  test('GFM : tableau, liste de tâches et texte barré', () => {
    const { container } = render(
      <Markdown
        source={'| a | b |\n| - | - |\n| 1 | 2 |\n\n- [x] fait\n- [ ] à faire\n\n~~barré~~'}
      />,
    )

    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(screen.getAllByRole('checkbox')).toHaveLength(2)
    expect(container.querySelector('del')).toHaveTextContent('barré')
  })

  test('un bloc php est délégué à CodeBlock, sans le saut de ligne final', async () => {
    const { container } = render(<Markdown source={'```php\necho 1;\n```'} />)

    const pre = container.querySelector('pre')
    expect(pre).toHaveAttribute('data-highlighted')
    expect(pre?.querySelector('code')?.textContent).toBe('echo 1;')

    await waitFor(
      () => expect(container.querySelector('pre')).toHaveAttribute('data-highlighted', 'true'),
      {
        timeout: 15000,
      },
    )
  }, 20000)

  test('le code inline n’est pas délégué à CodeBlock', () => {
    const { container } = render(<Markdown source="Utiliser `echo` ici." />)

    expect(container.querySelector('pre')).toBeNull()
    expect(container.querySelector('code')).toHaveTextContent('echo')
  })

  test('un bloc vide ou fait d’un seul saut de ligne est rendu sans erreur', async () => {
    const { container } = render(<Markdown source={'```php\n```\n\n```\n\n```'} />)

    expect(container.querySelectorAll('pre')).toHaveLength(2)

    await waitFor(
      () => {
        for (const pre of container.querySelectorAll('pre')) {
          expect(pre).toHaveAttribute('data-highlighted')
        }
      },
      { timeout: 15000 },
    )
  }, 20000)

  test('size="projection" agrandit le texte, la taille par défaut non', () => {
    const { container, rerender } = render(<Markdown source="Texte" />)
    const root = container.firstElementChild

    expect(root).toHaveClass('prose')
    expect(root).not.toHaveClass('prose-2xl')
    rerender(<Markdown source="Texte" size="projection" />)
    expect(container.firstElementChild).toHaveClass('prose', 'prose-2xl')
  })
})
