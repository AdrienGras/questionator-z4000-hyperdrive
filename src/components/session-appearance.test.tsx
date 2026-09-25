import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { AppearanceProvider } from '@/app/appearance-provider'
import type { NormalizedConfig } from '@/domain/config/normalize'
import { useUi } from '@/lib/i18n/use-ui'
import { makeConfig } from '@/testing/student-fixtures'
import { SessionAppearance } from './session-appearance'

const html = document.documentElement

function themed(overrides: Partial<NormalizedConfig> = {}): NormalizedConfig {
  const config = makeConfig()
  return {
    ...config,
    theme: { light: { primary: 'rgb(1, 2, 3)' }, dark: { primary: 'rgb(4, 5, 6)' } },
    ...overrides,
  }
}

function Label() {
  return <p>{useUi().text('back_home', {})}</p>
}

test('pose les tokens du mode par défaut de la config et les retire au démontage', () => {
  const config = themed({
    presentation: { ...makeConfig().presentation, defaultColorMode: 'dark' },
  })
  const { unmount } = render(
    <AppearanceProvider>
      <SessionAppearance sessionId="s1" view="examiner" config={config}>
        <Label />
      </SessionAppearance>
    </AppearanceProvider>,
  )
  expect(html).toHaveClass('dark')
  expect(html.style.getPropertyValue('--primary')).toBe('rgb(4, 5, 6)')
  unmount()
  expect(html.style.getPropertyValue('--primary')).toBe('')
  expect(html).not.toHaveClass('dark')
})

test('un choix mémorisé pour cette session et cette vue prime sur le défaut de la config', () => {
  localStorage.setItem('questionator:color-mode:s1:present', 'light')
  const config = themed({
    presentation: { ...makeConfig().presentation, defaultColorMode: 'dark' },
  })
  render(
    <AppearanceProvider>
      <SessionAppearance sessionId="s1" view="present" config={config}>
        <Label />
      </SessionAppearance>
    </AppearanceProvider>,
  )
  expect(html).not.toHaveClass('dark')
  expect(html.style.getPropertyValue('--primary')).toBe('rgb(1, 2, 3)')
})

test('la langue de la config s’applique aux enfants et à lang', () => {
  render(
    <AppearanceProvider>
      <SessionAppearance sessionId="s1" view="examiner" config={themed({ locale: 'en' })}>
        <Label />
      </SessionAppearance>
    </AppearanceProvider>,
  )
  expect(screen.getByText('Back to home')).toBeInTheDocument()
  expect(html.lang).toBe('en')
})

test('sans locale dans la config : langue du navigateur', () => {
  render(
    <AppearanceProvider>
      <SessionAppearance sessionId="s1" view="examiner" config={themed()}>
        <Label />
      </SessionAppearance>
    </AppearanceProvider>,
  )
  expect(screen.getByText("Retour à l'accueil")).toBeInTheDocument()
})
