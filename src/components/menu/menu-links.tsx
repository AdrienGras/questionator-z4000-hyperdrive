import {
  IconFileCode,
  IconHelpCircle,
  IconHome,
  IconPresentationAnalytics,
  IconSchool,
  type Icon,
} from '@tabler/icons-react'
import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import type { MenuItemId } from '@/components/menu/active-menu-item'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { Ui } from '@/lib/i18n/use-ui'
import { cn } from '@/lib/utils'

type MenuEntry = Readonly<{
  id: MenuItemId
  to: '/' | '/sessions' | '/editor' | '/trainings'
  label: 'menu_home' | 'menu_sessions' | 'menu_editor' | 'menu_training'
  icon: Icon
  /** Couleur de l'icône sur sa tuile neutre (code d'espace discret, D103). */
  tone: string
}>

const HOME: MenuEntry = {
  id: 'home',
  to: '/',
  label: 'menu_home',
  icon: IconHome,
  tone: 'text-muted-foreground',
}

const SPACES: readonly MenuEntry[] = [
  {
    id: 'sessions',
    to: '/sessions',
    label: 'menu_sessions',
    icon: IconPresentationAnalytics,
    tone: 'text-space-sessions',
  },
  {
    id: 'editor',
    to: '/editor',
    label: 'menu_editor',
    icon: IconFileCode,
    tone: 'text-space-editor',
  },
  {
    id: 'training',
    to: '/trainings',
    label: 'menu_training',
    icon: IconSchool,
    tone: 'text-space-training',
  },
]

const ROW_CLASS =
  'flex h-11 items-center gap-3 rounded-md px-2 font-medium text-sidebar-foreground hover:bg-sidebar-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sidebar-ring'
const ACTIVE_CLASS =
  'bg-sidebar-accent font-semibold shadow-[inset_3px_0_0_0_var(--color-sidebar-primary)]'
const COLLAPSED_ROW_CLASS = 'w-12 justify-center px-0'
const LIST_CLASS = 'flex flex-col gap-1'

/** Tuile d'icône neutre du menu, l'icône dans la couleur de son espace. */
function IconTile({ icon: TileIcon, tone }: Readonly<{ icon: Icon; tone: string }>) {
  return (
    <span
      className={cn(
        'inline-flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-muted',
        tone,
      )}
    >
      <TileIcon aria-hidden className="size-4.5" />
    </span>
  )
}

/** Replié, le libellé passe en `aria-label` et en infobulle, au survol comme au focus. */
function WithTooltip({
  collapsed,
  label,
  trigger,
}: Readonly<{ collapsed: boolean; label: string; trigger: React.ReactElement }>): ReactNode {
  if (!collapsed) return trigger
  return (
    <Tooltip>
      <TooltipTrigger render={trigger} />
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  )
}

type MenuLinksProps = Readonly<{
  ui: Ui
  active: MenuItemId | undefined
  collapsed: boolean
  /** Appelé au clic sur un lien (le tiroir se referme). */
  onNavigate?: () => void
}>

/**
 * Contenu du menu (D102, D103), commun au menu latéral et au tiroir : marque, Accueil, espaces,
 * Aide en pied. Le lien actif couvre les sous-écrans de son espace (`activeMenuItem`).
 */
export function MenuLinks({ ui, active, collapsed, onNavigate }: MenuLinksProps) {
  const { text } = ui
  const brand = text('menu_brand', {})

  function entryLink(entry: MenuEntry) {
    const label = text(entry.label, {})
    const isActive = entry.id === active
    return (
      <li key={entry.id}>
        <WithTooltip
          collapsed={collapsed}
          label={label}
          trigger={
            <Link
              to={entry.to}
              // Exact : TanStack pose son propre `aria-current` ; on le garde d'accord avec le nôtre.
              activeOptions={{ exact: true }}
              aria-current={isActive ? 'page' : undefined}
              aria-label={collapsed ? label : undefined}
              onClick={onNavigate}
              className={cn(ROW_CLASS, isActive && ACTIVE_CLASS, collapsed && COLLAPSED_ROW_CLASS)}
            >
              <IconTile icon={entry.icon} tone={entry.tone} />
              {!collapsed && label}
            </Link>
          }
        />
      </li>
    )
  }

  const helpLabel = text('help_link', {})
  return (
    <>
      <div className={cn('flex items-center gap-2.5 font-bold', !collapsed && 'px-2')}>
        <span
          aria-hidden
          className="block size-7 shrink-0 rounded-[9px] bg-linear-135 from-primary to-action-to"
        />
        {/* Replié : le carré seul, le nom reste pour les lecteurs d'écran. */}
        <span className={cn(collapsed && 'sr-only')}>{brand}</span>
      </div>
      <nav aria-label={text('menu_main_label', {})} className="w-full">
        <ul className={cn(LIST_CLASS, collapsed && 'items-center')}>{entryLink(HOME)}</ul>
      </nav>
      {collapsed ? (
        <hr aria-hidden className="h-px w-6 self-center border-0 bg-sidebar-border" />
      ) : (
        <div className="px-2 text-label text-muted-foreground uppercase">
          {text('menu_spaces', {})}
        </div>
      )}
      <nav aria-label={text('menu_spaces', {})} className="w-full">
        <ul className={cn(LIST_CLASS, collapsed && 'items-center')}>{SPACES.map(entryLink)}</ul>
      </nav>
      <nav aria-label={text('menu_help_label', {})} className="mt-auto w-full">
        <ul className={cn(LIST_CLASS, collapsed && 'items-center')}>
          <li>
            <WithTooltip
              collapsed={collapsed}
              label={helpLabel}
              trigger={
                <a
                  href={`${import.meta.env.BASE_URL}docs/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={text('help_link_label', {})}
                  onClick={onNavigate}
                  className={cn(ROW_CLASS, collapsed && COLLAPSED_ROW_CLASS)}
                >
                  <IconTile icon={IconHelpCircle} tone="text-space-help" />
                  {!collapsed && helpLabel}
                </a>
              }
            />
          </li>
        </ul>
      </nav>
    </>
  )
}
