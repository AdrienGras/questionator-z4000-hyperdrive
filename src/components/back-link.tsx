import { IconChevronLeft } from '@tabler/icons-react'
import { createLink } from '@tanstack/react-router'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

/** Ancre du lien retour : chevron, petit texte gris, sans soulignement (artboards F44). */
function BackAnchor({ className, children, ...props }: Readonly<ComponentProps<'a'>>) {
  return (
    <a
      {...props}
      className={cn(
        'inline-flex items-center gap-1 self-start text-sm font-medium text-muted-foreground hover:text-foreground',
        className,
      )}
    >
      <IconChevronLeft aria-hidden className="size-4 shrink-0" />
      {children}
    </a>
  )
}

/**
 * Lien retour d'un écran hors fil d'Ariane (D103) : un `Link` TanStack typé, rendu par
 * `BackAnchor`. Usage : `<BackLink to="/">{text('back_home', {})}</BackLink>`.
 */
export const BackLink = createLink(BackAnchor)
