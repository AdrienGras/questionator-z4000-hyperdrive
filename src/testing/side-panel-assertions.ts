import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { expect } from 'vitest'

/**
 * Bouton « Panneau » de la barre de titre de l'écran de passage (F21). Attendu : le premier
 * montage passe par le découpage de route à la demande, jamais synchrone (`src/testing/setup.ts`).
 * Introuvable tant que le tiroir modal est ouvert (reste de la page masqué).
 */
export function panelButton(): Promise<HTMLElement> {
  return screen.findByRole('button', { name: 'Panneau' })
}

/**
 * Ouvre le tiroir latéral par le bouton « Panneau », puis l'onglet `tab` s'il est donné, et
 * renvoie le `dialog` « Panneau latéral ». Le tiroir est rendu en portail : les requêtes se font
 * dans le `dialog` renvoyé, jamais dans le `container` du rendu.
 */
export async function openSidePanel(tab?: 'Étudiant' | 'Étudiants'): Promise<HTMLElement> {
  fireEvent.click(await panelButton())
  const dialog = await screen.findByRole('dialog', { name: 'Panneau latéral' })
  if (tab !== undefined) fireEvent.click(within(dialog).getByRole('tab', { name: tab }))
  return dialog
}

/** Attend la fermeture du tiroir latéral (plus de `dialog` « Panneau latéral »). */
export async function expectPanelClosed(): Promise<void> {
  await waitFor(() =>
    expect(screen.queryByRole('dialog', { name: 'Panneau latéral' })).not.toBeInTheDocument(),
  )
}

/**
 * Le tiroir est toujours ouvert après l'action en cours. On laisse d'abord passer les
 * continuations en attente (la vue ne ferme le tiroir qu'après la résolution de l'écriture),
 * puis on vérifie l'état et non la seule présence : base-ui garde le `dialog` monté pendant sa
 * sortie, marqué `data-closed` / `data-ending-style` au lieu de `data-open`.
 */
export async function expectPanelStaysOpen(): Promise<void> {
  await act(() => new Promise((resolve) => setTimeout(resolve, 50)))
  const dialog = screen.getByRole('dialog', { name: 'Panneau latéral' })
  expect(dialog).toHaveAttribute('data-open')
  expect(dialog).not.toHaveAttribute('data-closed')
  expect(dialog).not.toHaveAttribute('data-ending-style')
}
