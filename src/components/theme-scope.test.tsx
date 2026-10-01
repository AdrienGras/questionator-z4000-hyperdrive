import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { AppearanceProvider } from '@/app/appearance-provider'
import { useColorModeControl } from '@/lib/appearance/appearance-context'
import { ThemeScope } from '@/components/theme-scope'

const theme = { light: { primary: 'rgb(1, 2, 3)' }, dark: { primary: 'rgb(4, 5, 6)' } }

function ToDark() {
  const { setMode } = useColorModeControl()
  return (
    <button type="button" onClick={() => setMode('dark')}>
      sombre
    </button>
  )
}

describe('ThemeScope', () => {
  afterEach(() => window.localStorage.clear())

  it('pose les variables du mode effectif sur son div, puis celles du sombre', () => {
    render(
      <AppearanceProvider>
        <ToDark />
        <ThemeScope theme={theme} className="x">
          <p>contenu</p>
        </ThemeScope>
      </AppearanceProvider>,
    )
    const scope = screen.getByText('contenu').parentElement!
    expect(scope).toHaveClass('x')
    expect(scope.style.getPropertyValue('--primary')).toBe('rgb(1, 2, 3)')
    fireEvent.click(screen.getByText('sombre'))
    expect(scope.style.getPropertyValue('--primary')).toBe('rgb(4, 5, 6)')
  })
})
