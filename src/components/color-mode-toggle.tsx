import { IconMoon, IconSun } from '@tabler/icons-react'
import { WithTooltip } from '@/components/menu/menu-links'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { isColorMode, type ColorMode } from '@/lib/appearance/color-mode'
import { useColorModeControl } from '@/lib/appearance/appearance-context'
import type { Ui } from '@/lib/i18n/use-ui'
import { cn } from '@/lib/utils'

const MODES: readonly ColorMode[] = ['light', 'dark', 'system']

/**
 * Bascule clair / sombre / système de la portée d'apparence active (D26, D60), en pied de menu
 * (artboard `clair/menu-bascule`, D112) : même gabarit que « Replier le menu ». Replié, le libellé
 * passe en `aria-label` et en infobulle ; les choix s'ouvrent à droite.
 */
export function ColorModeToggle({ ui, collapsed }: Readonly<{ ui: Ui; collapsed: boolean }>) {
  const { text } = ui
  const { mode, effective, setMode } = useColorModeControl()
  const label = (value: ColorMode) => text(`color_mode_${value}`, {})
  const toggleLabel = text('color_mode_label', { mode: label(mode) })
  const ModeIcon = effective === 'dark' ? IconMoon : IconSun
  return (
    <DropdownMenu>
      <WithTooltip
        collapsed={collapsed}
        label={toggleLabel}
        trigger={
          <DropdownMenuTrigger
            aria-label={collapsed ? toggleLabel : undefined}
            className={cn(
              'flex h-9 w-full items-center gap-3 rounded-md px-3.5 text-[13px] font-medium text-muted-foreground hover:bg-sidebar-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sidebar-ring',
              collapsed && 'mx-auto w-12 justify-center px-0',
            )}
          >
            <ModeIcon aria-hidden className="size-4.5 shrink-0" />
            {!collapsed && toggleLabel}
          </DropdownMenuTrigger>
        }
      />
      <DropdownMenuContent side="right" align="end" className="w-auto">
        <DropdownMenuRadioGroup
          value={mode}
          onValueChange={(value: unknown) => {
            if (isColorMode(value)) setMode(value)
          }}
        >
          {MODES.map((value) => (
            // base-ui garde un RadioItem ouvert par défaut ; ouvert, le menu capte le clic suivant (#76).
            <DropdownMenuRadioItem key={value} value={value} closeOnClick>
              {label(value)}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
