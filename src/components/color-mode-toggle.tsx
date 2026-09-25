import { IconMoon, IconSun } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
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

const MODES: readonly ColorMode[] = ['light', 'dark', 'system']

/** Bascule clair / sombre / système de la portée d'apparence active (D26, D60). */
export function ColorModeToggle({ ui }: Readonly<{ ui: Ui }>) {
  const { text } = ui
  const { mode, effective, setMode } = useColorModeControl()
  const label = (value: ColorMode) => text(`color_mode_${value}`, {})
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label={text('color_mode_label', { mode: label(mode) })}
          />
        }
      >
        {effective === 'dark' ? <IconMoon /> : <IconSun />}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-auto">
        <DropdownMenuRadioGroup
          value={mode}
          onValueChange={(value: unknown) => {
            if (isColorMode(value)) setMode(value)
          }}
        >
          {MODES.map((value) => (
            <DropdownMenuRadioItem key={value} value={value}>
              {label(value)}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
