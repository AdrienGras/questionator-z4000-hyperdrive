import { render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import { LocaleProvider, LocaleScope, resolveSessionLocale, useLocale } from './locale-context'
import { useUi } from './use-ui'

function ShowLocale() {
  const { locale, text } = useUi()
  return (
    <p>
      {useLocale()} {locale} {text('back_home', {})}
    </p>
  )
}

function CurrentLocale() {
  return <>{useLocale()}</>
}

describe('resolveSessionLocale', () => {
  test('la langue de la config prime', () => {
    expect(resolveSessionLocale('en', ['fr-FR'])).toBe('en')
  })
  test('sinon la langue du navigateur', () => {
    expect(resolveSessionLocale(undefined, ['en-GB'])).toBe('en')
  })
  test('sinon fr', () => {
    expect(resolveSessionLocale(undefined, ['de-DE'])).toBe('fr')
  })
})

describe('LocaleProvider', () => {
  test('hors provider : langue du navigateur (fr sous setup)', () => {
    render(<ShowLocale />)
    expect(screen.getByText('fr fr Retour à l’accueil')).toBeInTheDocument()
  })

  test('useUi suit la locale du provider', () => {
    render(
      <LocaleProvider locale="en">
        <ShowLocale />
      </LocaleProvider>,
    )
    expect(screen.getByText('en en Back to home')).toBeInTheDocument()
  })

  test('pose lang sur <html> et rétablit la valeur précédente au démontage', () => {
    document.documentElement.lang = 'fr'
    const { unmount } = render(
      <LocaleProvider locale="en">
        <p>x</p>
      </LocaleProvider>,
    )
    expect(document.documentElement.lang).toBe('en')
    unmount()
    expect(document.documentElement.lang).toBe('fr')
  })

  test("le provider le plus proche l'emporte, et le parent reprend la main", () => {
    document.documentElement.lang = ''
    const { rerender } = render(
      <LocaleProvider locale="fr">
        <LocaleProvider locale="en">
          <ShowLocale />
        </LocaleProvider>
      </LocaleProvider>,
    )
    expect(screen.getByText('en en Back to home')).toBeInTheDocument()
    expect(document.documentElement.lang).toBe('en')
    rerender(
      <LocaleProvider locale="fr">
        <ShowLocale />
      </LocaleProvider>,
    )
    expect(document.documentElement.lang).toBe('fr')
  })

  test('provider imbriqué monté d’emblée : lang dès le montage initial, sans rerender', () => {
    document.documentElement.lang = ''
    render(
      <LocaleProvider locale="fr">
        <LocaleProvider locale="en">
          <ShowLocale />
        </LocaleProvider>
      </LocaleProvider>,
    )
    expect(screen.getByText('en en Back to home')).toBeInTheDocument()
    expect(document.documentElement.lang).toBe('en')
  })
})

/** Propriétaire `owner` et un `LocaleProvider` imbriqué par entrée de `nested`, frères. */
function Owner({
  owner,
  nested,
}: Readonly<{ owner: 'fr' | 'en'; nested: ReadonlyArray<'fr' | 'en'> }>) {
  return (
    <LocaleProvider locale={owner}>
      <span data-testid="owner">
        <CurrentLocale />
      </span>
      {nested.map((locale, index) => (
        // oxlint-disable-next-line react/no-array-index-key -- liste figée par le test, rang = identité.
        <LocaleProvider key={index} locale={locale}>
          <ShowLocale />
        </LocaleProvider>
      ))}
    </LocaleProvider>
  )
}

describe('LocaleProvider : déclarations (#87)', () => {
  test('locale du propriétaire changée pendant une déclaration active : la déclaration garde lang', () => {
    document.documentElement.lang = ''
    const { rerender } = render(<Owner owner="fr" nested={['fr']} />)
    expect(document.documentElement.lang).toBe('fr')
    rerender(<Owner owner="en" nested={['fr']} />)
    expect(screen.getByTestId('owner')).toHaveTextContent('en')
    expect(document.documentElement.lang).toBe('fr')
    rerender(<Owner owner="en" nested={[]} />)
    expect(document.documentElement.lang).toBe('en')
  })

  test('deux imbriqués frères de même locale : retirer l’un garde la déclaration de l’autre', () => {
    document.documentElement.lang = ''
    const { rerender } = render(<Owner owner="fr" nested={['en', 'en']} />)
    expect(screen.getAllByText('en en Back to home')).toHaveLength(2)
    expect(document.documentElement.lang).toBe('en')
    rerender(<Owner owner="fr" nested={['en']} />)
    expect(document.documentElement.lang).toBe('en')
    rerender(<Owner owner="fr" nested={[]} />)
    expect(document.documentElement.lang).toBe('fr')
  })
})

describe('LocaleScope', () => {
  test('change la langue des enfants sans toucher <html lang> sous un provider', () => {
    document.documentElement.lang = ''
    render(
      <LocaleProvider locale="fr">
        <LocaleScope locale="en">
          <ShowLocale />
        </LocaleScope>
      </LocaleProvider>,
    )
    expect(screen.getByText('en en Back to home')).toBeInTheDocument()
    expect(document.documentElement.lang).toBe('fr')
  })

  test('hors provider : ne pose pas lang sur <html>', () => {
    document.documentElement.lang = 'fr'
    const { unmount } = render(
      <LocaleScope locale="en">
        <ShowLocale />
      </LocaleScope>,
    )
    expect(screen.getByText('en en Back to home')).toBeInTheDocument()
    expect(document.documentElement.lang).toBe('fr')
    unmount()
    expect(document.documentElement.lang).toBe('fr')
  })

  test('un provider imbriqué sous la portée se déclare toujours au propriétaire', () => {
    document.documentElement.lang = ''
    render(
      <LocaleProvider locale="fr">
        <LocaleScope locale="en">
          <LocaleProvider locale="en">
            <ShowLocale />
          </LocaleProvider>
        </LocaleScope>
      </LocaleProvider>,
    )
    expect(document.documentElement.lang).toBe('en')
  })
})
