import { render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import { LocaleProvider, resolveSessionLocale, useLocale } from './locale-context'
import { useUi } from './use-ui'

function ShowLocale() {
  const { locale, text } = useUi()
  return (
    <p>
      {useLocale()} {locale} {text('back_home', {})}
    </p>
  )
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
    expect(screen.getByText("fr fr Retour à l'accueil")).toBeInTheDocument()
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
