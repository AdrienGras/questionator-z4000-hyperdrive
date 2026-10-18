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
 * Le tiroir latéral ouvert, ou `null` : le `dialog` qui porte la liste d'onglets « Panneau » (son
 * nom accessible est celui de la session, F44.7). `label` suit la langue de la session.
 */
export function querySidePanel(label = 'Panneau'): HTMLElement | null {
  return (
    screen
      .queryAllByRole('dialog')
      .find((dialog) => within(dialog).queryByRole('tablist', { name: label }) !== null) ?? null
  )
}

/** Le tiroir latéral ouvert ; échoue s'il ne l'est pas. */
export function sidePanel(label = 'Panneau'): HTMLElement {
  const dialog = querySidePanel(label)
  if (dialog === null) throw new Error('tiroir latéral fermé')
  return dialog
}

/** Attend l'ouverture du tiroir latéral et le renvoie. */
export function findSidePanel(label = 'Panneau'): Promise<HTMLElement> {
  return waitFor(() => sidePanel(label))
}

/**
 * Ouvre le tiroir latéral par le bouton « Panneau », puis l'onglet `tab` s'il est donné, et
 * renvoie le tiroir. Il est rendu en portail : les requêtes se font dans le `dialog` renvoyé,
 * jamais dans le `container` du rendu.
 */
export async function openSidePanel(tab?: 'Cet étudiant' | 'Liste'): Promise<HTMLElement> {
  fireEvent.click(await panelButton())
  const dialog = await findSidePanel()
  if (tab !== undefined) fireEvent.click(within(dialog).getByRole('tab', { name: tab }))
  return dialog
}

/** Attend la fermeture du tiroir latéral. */
export async function expectPanelClosed(): Promise<void> {
  await waitFor(() => expect(querySidePanel()).not.toBeInTheDocument())
}

/**
 * Le tiroir est toujours ouvert après l'action en cours. On laisse d'abord passer les
 * continuations en attente (la vue ne ferme le tiroir qu'après la résolution de l'écriture),
 * puis on vérifie l'état et non la seule présence : base-ui garde le `dialog` monté pendant sa
 * sortie, marqué `data-closed` / `data-ending-style` au lieu de `data-open`.
 */
export async function expectPanelStaysOpen(): Promise<void> {
  await act(() => new Promise((resolve) => setTimeout(resolve, 50)))
  const dialog = sidePanel()
  expect(dialog).toHaveAttribute('data-open')
  expect(dialog).not.toHaveAttribute('data-closed')
  expect(dialog).not.toHaveAttribute('data-ending-style')
}
