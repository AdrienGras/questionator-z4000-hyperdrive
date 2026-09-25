import { fireEvent, render, screen } from '@testing-library/react'
import { useMemo } from 'react'
import { expect, test } from 'vitest'
import { AppearanceProvider } from '@/app/appearance-provider'
import { colorModeKey } from '@/lib/appearance/color-mode'
import { useAppearanceScope } from '@/lib/appearance/appearance-context'
import { useUi } from '@/lib/i18n/use-ui'
import { ColorModeToggle } from './color-mode-toggle'

function Toggle() {
  return <ColorModeToggle ui={useUi()} />
}

function PresentToggle() {
  const scope = useMemo(
    () => ({
      key: colorModeKey({ sessionId: 's1', view: 'present' as const }),
      defaultMode: 'light' as const,
    }),
    [],
  )
  useAppearanceScope(scope)
  return <Toggle />
}

test('affiche le mode courant et permet d’en choisir un autre', async () => {
  render(
    <AppearanceProvider>
      <Toggle />
    </AppearanceProvider>,
  )
  const trigger = screen.getByRole('button', { name: "Mode d'affichage : Système" })
  fireEvent.click(trigger)
  fireEvent.click(await screen.findByRole('menuitemradio', { name: 'Sombre' }))
  expect(document.documentElement).toHaveClass('dark')
  expect(
    await screen.findByRole('button', { name: "Mode d'affichage : Sombre" }),
  ).toBeInTheDocument()
})

test('dans la vue projetée, le choix ne touche pas la clé de la vue examinateur', async () => {
  localStorage.setItem('questionator:color-mode:s1:examiner', 'light')
  render(
    <AppearanceProvider>
      <PresentToggle />
    </AppearanceProvider>,
  )
  fireEvent.click(screen.getByRole('button', { name: "Mode d'affichage : Clair" }))
  fireEvent.click(await screen.findByRole('menuitemradio', { name: 'Sombre' }))
  expect(localStorage.getItem('questionator:color-mode:s1:present')).toBe('dark')
  expect(localStorage.getItem('questionator:color-mode:s1:examiner')).toBe('light')
})
