import { IconDots } from '@tabler/icons-react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

type CardActionsMenuProps = Readonly<{
  /** Nom accessible du bouton déclencheur (ex. `card_actions`). */
  label: string
  /** Les `DropdownMenuItem` (et séparateurs) du menu. */
  children: ReactNode
}>

/** Menu « … » d'une carte : bouton icône discret, contenu aligné à droite. */
export function CardActionsMenu({ label, children }: CardActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" aria-label={label} />}>
        <IconDots />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-auto">
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
