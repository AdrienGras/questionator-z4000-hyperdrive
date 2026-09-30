import { fireEvent, screen, within } from '@testing-library/react'

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
