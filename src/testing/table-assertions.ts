import { within } from '@testing-library/react'

/** Texte visible d'une cellule : sans les nœuds `presentation` (ex. le « x » masqué d'une `Progress` base-ui). */
function visibleText(cell: HTMLElement): string {
  const copy = cell.cloneNode(true)
  if (!(copy instanceof HTMLElement)) return cell.textContent
  for (const hidden of copy.querySelectorAll('[role="presentation"]')) hidden.remove()
  return copy.textContent
}

/** Cellules de la ligne dont l'en-tête de ligne vaut `label`, dans le tableau donné. */
export function rowCells(table: HTMLElement, label: string): string[] {
  const row = within(table).getByRole('rowheader', { name: label }).closest('tr')
  if (row === null) throw new Error(`ligne ${label} introuvable`)
  return within(row).getAllByRole('cell').map(visibleText)
}
