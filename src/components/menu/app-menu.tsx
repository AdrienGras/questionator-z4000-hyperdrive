import { IconLayoutSidebarLeftCollapse, IconLayoutSidebarLeftExpand } from '@tabler/icons-react'
import { useLocation } from '@tanstack/react-router'
import { useState } from 'react'
import { activeMenuItem } from '@/components/menu/active-menu-item'
import { MenuDrawer } from '@/components/menu/menu-drawer'
import { MenuLinks, WithTooltip } from '@/components/menu/menu-links'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useUi } from '@/lib/i18n/use-ui'
import { readMenuCollapsed, writeMenuCollapsed } from '@/lib/menu-collapsed'
import { cn } from '@/lib/utils'

/**
 * Menu latéral permanent (D102, D103), monté une fois dans `RootLayout`, hors vue projetée ; en
 * tiroir sous 768 px (`MenuDrawer`). Langue de l'application, pas celle d'une session (D105) :
 * `lang` le dit aux lecteurs d'écran quand une session passe `<html>` dans une autre langue. Ses
 * tokens `sidebar-*` sont lus sur `<html>`, où le thème de la session s'applique.
 */
export function AppMenu() {
  const ui = useUi()
  const { text } = ui
  const pathname = useLocation({ select: (location) => location.pathname })
  const active = activeMenuItem(pathname)
  const [collapsed, setCollapsed] = useState(readMenuCollapsed)

  function toggle() {
    const next = !collapsed
    setCollapsed(next)
    writeMenuCollapsed(next)
  }

  const toggleLabel = text(collapsed ? 'menu_expand' : 'menu_collapse', {})
  const ToggleIcon = collapsed ? IconLayoutSidebarLeftExpand : IconLayoutSidebarLeftCollapse
  return (
    <TooltipProvider>
      <MenuDrawer ui={ui} active={active} />
      <aside
        lang={ui.locale}
        className={cn(
          'sticky top-0 hidden h-svh shrink-0 flex-col gap-5 overflow-y-auto border-r border-sidebar-border bg-sidebar px-3 py-5 text-sidebar-foreground transition-[width] motion-reduce:transition-none md:flex',
          collapsed ? 'w-18 items-center' : 'w-62',
        )}
      >
        <MenuLinks ui={ui} active={active} collapsed={collapsed} />
        <div className="-mt-3 w-full border-t border-sidebar-border pt-2">
          <WithTooltip
            collapsed={collapsed}
            label={toggleLabel}
            trigger={
              <button
                type="button"
                aria-expanded={!collapsed}
                aria-label={collapsed ? toggleLabel : undefined}
                onClick={toggle}
                className={cn(
                  'flex h-9 w-full items-center gap-3 rounded-md px-3.5 text-[13px] font-medium text-muted-foreground hover:bg-sidebar-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sidebar-ring',
                  collapsed && 'mx-auto w-12 justify-center px-0',
                )}
              >
                <ToggleIcon aria-hidden className="size-4.5 shrink-0" />
                {!collapsed && toggleLabel}
              </button>
            }
          />
        </div>
      </aside>
    </TooltipProvider>
  )
}
