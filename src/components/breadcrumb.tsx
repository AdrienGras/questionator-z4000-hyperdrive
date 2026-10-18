import { IconChevronRight } from '@tabler/icons-react'
import { Link } from '@tanstack/react-router'
import type { Ui } from '@/lib/i18n/use-ui'

type BreadcrumbProps = Readonly<{
  ui: Ui
  /** L'espace : un lien vers sa page, ou la page courante sans `to`. */
  root: { label: string; to?: '/sessions' }
  /** Ce qui suit l'espace, séparé par un point (`<nom de session> · <titre de l'oral>`). */
  parts?: readonly string[]
}>

/**
 * Fil d'Ariane d'un écran d'espace (D103), à la place du lien « Retour à l'accueil » : l'espace,
 * puis un chevron et les `parts`, comme sur l'artboard `passage-question`.
 */
export function Breadcrumb({ ui, root, parts = [] }: BreadcrumbProps) {
  return (
    <nav
      aria-label={ui.text('breadcrumb_label', {})}
      className="flex min-w-0 flex-wrap items-center gap-1.5 text-sm text-muted-foreground"
    >
      {root.to === undefined ? (
        <span aria-current="page">{root.label}</span>
      ) : (
        <Link to={root.to} className="hover:text-foreground">
          {root.label}
        </Link>
      )}
      {parts.length > 0 && <IconChevronRight aria-hidden className="size-4 shrink-0" />}
      {parts.map((part, index) => (
        <span key={`${index}|${part}`} className="contents">
          {index > 0 && <span aria-hidden>·</span>}
          <span className="min-w-0 break-words">{part}</span>
        </span>
      ))}
    </nav>
  )
}
