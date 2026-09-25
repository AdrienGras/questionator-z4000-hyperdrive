import { act, fireEvent, render, screen } from '@testing-library/react'
import { useMemo, useState } from 'react'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { colorModeKey } from '@/lib/appearance/color-mode'
import {
  useAppearanceScope,
  useColorModeControl,
  type AppearanceScope,
} from '@/lib/appearance/appearance-context'
import { setSystemDark } from '@/testing/match-media'
import { AppearanceProvider } from './appearance-provider'

const html = document.documentElement

function Control() {
  const { mode, effective, setMode } = useColorModeControl()
  return (
    <div>
      <p>
        {mode}/{effective}
      </p>
      <button type="button" onClick={() => setMode('dark')}>
        sombre
      </button>
      <button type="button" onClick={() => setMode('light')}>
        clair
      </button>
    </div>
  )
}

function Scoped({ scope }: Readonly<{ scope: AppearanceScope }>) {
  useAppearanceScope(scope)
  return <Control />
}

function Toggle() {
  const [shown, setShown] = useState(true)
  return (
    <>
      <button type="button" onClick={() => setShown(false)}>
        quitter
      </button>
      {shown ? <Scoped scope={SESSION_SCOPE} /> : <Control />}
    </>
  )
}

function Live() {
  const [primary, setPrimary] = useState('rgb(1, 2, 3)')
  const scope = useMemo<AppearanceScope>(
    () => ({ ...SESSION_SCOPE, theme: { light: { primary }, dark: {} } }),
    [primary],
  )
  useAppearanceScope(scope)
  return (
    <button type="button" onClick={() => setPrimary('rgb(9, 9, 9)')}>
      changer
    </button>
  )
}

const SESSION_SCOPE: AppearanceScope = {
  key: colorModeKey({ sessionId: 's1', view: 'examiner' }),
  defaultMode: 'light',
  theme: {
    light: { primary: 'rgb(1, 2, 3)', radius: '0.5rem' },
    dark: { primary: 'rgb(4, 5, 6)' },
  },
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('AppearanceProvider — portée globale', () => {
  test('défaut system : suit la préférence du système, en direct', () => {
    render(
      <AppearanceProvider>
        <Control />
      </AppearanceProvider>,
    )
    expect(screen.getByText('system/light')).toBeInTheDocument()
    expect(html).not.toHaveClass('dark')
    act(() => setSystemDark(true))
    expect(screen.getByText('system/dark')).toBeInTheDocument()
    expect(html).toHaveClass('dark')
  })

  test('le choix manuel est mémorisé sous la clé globale', () => {
    render(
      <AppearanceProvider>
        <Control />
      </AppearanceProvider>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'sombre' }))
    expect(html).toHaveClass('dark')
    expect(localStorage.getItem('questionator:color-mode:global')).toBe('dark')
  })

  test('relit le choix mémorisé au montage', () => {
    localStorage.setItem('questionator:color-mode:global', 'dark')
    render(
      <AppearanceProvider>
        <Control />
      </AppearanceProvider>,
    )
    expect(screen.getByText('dark/dark')).toBeInTheDocument()
  })

  test('le mode mémorisé est lu une seule fois par clé : une écriture externe entre-temps ne bascule pas le mode', () => {
    render(
      <AppearanceProvider>
        <Control />
      </AppearanceProvider>,
    )
    expect(screen.getByText('system/light')).toBeInTheDocument()
    // Écriture directe (autre onglet), hors du flux `setMode` de cette fenêtre.
    localStorage.setItem('questionator:color-mode:global', 'dark')
    // Un rendu non lié (préférence système) ne doit pas relire la clé.
    act(() => setSystemDark(true))
    expect(screen.getByText('system/dark')).toBeInTheDocument()
  })

  test('stockage inaccessible : le choix s’applique quand même dans la fenêtre', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('SecurityError')
    })
    render(
      <AppearanceProvider>
        <Control />
      </AppearanceProvider>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'sombre' }))
    expect(screen.getByText('dark/dark')).toBeInTheDocument()
    expect(html).toHaveClass('dark')
  })

  test('au démontage du provider, plus de classe .dark', () => {
    localStorage.setItem('questionator:color-mode:global', 'dark')
    const { unmount } = render(
      <AppearanceProvider>
        <Control />
      </AppearanceProvider>,
    )
    unmount()
    expect(html).not.toHaveClass('dark')
  })
})

describe('AppearanceProvider — portée déclarée', () => {
  test('applique les tokens du mode effectif via setProperty, puis ceux de l’autre mode', () => {
    const setProperty = vi.spyOn(CSSStyleDeclaration.prototype, 'setProperty')
    render(
      <AppearanceProvider>
        <Scoped scope={SESSION_SCOPE} />
      </AppearanceProvider>,
    )
    expect(html.style.getPropertyValue('--primary')).toBe('rgb(1, 2, 3)')
    expect(html.style.getPropertyValue('--radius')).toBe('0.5rem')
    expect(setProperty).toHaveBeenCalledWith('--primary', 'rgb(1, 2, 3)')
    fireEvent.click(screen.getByRole('button', { name: 'sombre' }))
    expect(html.style.getPropertyValue('--primary')).toBe('rgb(4, 5, 6)')
    // `radius` n'est défini qu'en clair : il ne reste pas en sombre.
    expect(html.style.getPropertyValue('--radius')).toBe('')
    expect(localStorage.getItem('questionator:color-mode:s1:examiner')).toBe('dark')
    expect(localStorage.getItem('questionator:color-mode:global')).toBeNull()
  })

  test('retirer la portée ramène à la portée globale, sans token résiduel', () => {
    localStorage.setItem('questionator:color-mode:s1:examiner', 'dark')
    render(
      <AppearanceProvider>
        <Toggle />
      </AppearanceProvider>,
    )
    expect(html).toHaveClass('dark')
    fireEvent.click(screen.getByRole('button', { name: 'quitter' }))
    expect(html.style.getPropertyValue('--primary')).toBe('')
    expect(html).not.toHaveClass('dark')
    expect(screen.getByText('system/light')).toBeInTheDocument()
  })

  test('une portée re-mémoïsée (nouvelle config) remplace la précédente', () => {
    render(
      <AppearanceProvider>
        <Live />
      </AppearanceProvider>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'changer' }))
    expect(html.style.getPropertyValue('--primary')).toBe('rgb(9, 9, 9)')
  })
})

describe('AppearanceProvider — pile de portées imbriquées', () => {
  const OUTER_SCOPE: AppearanceScope = {
    key: colorModeKey({ sessionId: 'outer', view: 'examiner' }),
    defaultMode: 'light',
    theme: { light: { primary: 'rgb(1, 1, 1)' }, dark: {} },
  }
  const INNER_SCOPE: AppearanceScope = {
    key: colorModeKey({ sessionId: 'inner', view: 'examiner' }),
    defaultMode: 'light',
    theme: { light: { primary: 'rgb(2, 2, 2)' }, dark: {} },
  }

  function Inner() {
    useAppearanceScope(INNER_SCOPE)
    return null
  }

  // La portée interne se déclare *après-coup*, une fois la portée externe déjà montée : c'est le
  // cas F15 visé par le point 1 (un enfant qui s'ouvre plus tard, ex. un panneau). Monter les deux
  // dans le même commit donnerait, par l'ordre des effets React (enfant puis parent), l'externe en
  // dernière position dès le départ — ce n'est pas le scénario du bogue.
  function Nested() {
    const [outerPrimary, setOuterPrimary] = useState('rgb(1, 1, 1)')
    const [showInner, setShowInner] = useState(false)
    const outerScope = useMemo<AppearanceScope>(
      () => ({ ...OUTER_SCOPE, theme: { light: { primary: outerPrimary }, dark: {} } }),
      [outerPrimary],
    )
    useAppearanceScope(outerScope)
    return (
      <>
        <button type="button" onClick={() => setShowInner(true)}>
          afficher interne
        </button>
        <button type="button" onClick={() => setOuterPrimary('rgb(3, 3, 3)')}>
          externe
        </button>
        <button type="button" onClick={() => setShowInner(false)}>
          retirer interne
        </button>
        {showInner ? <Inner /> : null}
      </>
    )
  }

  function NestedSameValue() {
    const [tick, setTick] = useState(0)
    const [showInner, setShowInner] = useState(false)
    // Nouvel objet à chaque rendu, même contenu (simule une émission `liveQuery` inchangée).
    const outerScope: AppearanceScope = {
      ...OUTER_SCOPE,
      theme: { light: { primary: 'rgb(1, 1, 1)' }, dark: {} },
    }
    useAppearanceScope(outerScope)
    return (
      <>
        <p>tick {tick}</p>
        <button type="button" onClick={() => setShowInner(true)}>
          afficher interne
        </button>
        <button type="button" onClick={() => setTick((value) => value + 1)}>
          re-rendre
        </button>
        {showInner ? <Inner /> : null}
      </>
    )
  }

  test('une portée externe re-mémoïsée avec une nouvelle valeur garde sa place sous la portée interne', () => {
    render(
      <AppearanceProvider>
        <Nested />
      </AppearanceProvider>,
    )
    expect(html.style.getPropertyValue('--primary')).toBe('rgb(1, 1, 1)')
    fireEvent.click(screen.getByRole('button', { name: 'afficher interne' }))
    expect(html.style.getPropertyValue('--primary')).toBe('rgb(2, 2, 2)')
    fireEvent.click(screen.getByRole('button', { name: 'externe' }))
    expect(html.style.getPropertyValue('--primary')).toBe('rgb(2, 2, 2)')
    fireEvent.click(screen.getByRole('button', { name: 'retirer interne' }))
    expect(html.style.getPropertyValue('--primary')).toBe('rgb(3, 3, 3)')
  })

  test('une portée externe re-mémoïsée avec la même valeur garde sa place et le rendu reste juste', () => {
    render(
      <AppearanceProvider>
        <NestedSameValue />
      </AppearanceProvider>,
    )
    expect(html.style.getPropertyValue('--primary')).toBe('rgb(1, 1, 1)')
    fireEvent.click(screen.getByRole('button', { name: 'afficher interne' }))
    expect(html.style.getPropertyValue('--primary')).toBe('rgb(2, 2, 2)')
    fireEvent.click(screen.getByRole('button', { name: 're-rendre' }))
    expect(html.style.getPropertyValue('--primary')).toBe('rgb(2, 2, 2)')
  })
})

test('useColorModeControl hors provider lève une erreur explicite', () => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
  expect(() => render(<Control />)).toThrow(/AppearanceProvider/)
})
