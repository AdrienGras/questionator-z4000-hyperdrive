import { IconMenu2, IconX } from '@tabler/icons-react'
import { useState } from 'react'
import type { MenuItemId } from '@/components/menu/active-menu-item'
import { MenuLinks } from '@/components/menu/menu-links'
import { Button } from '@/components/ui/button'
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import type { Ui } from '@/lib/i18n/use-ui'

type MenuDrawerProps = Readonly<{
  ui: Ui
  active: MenuItemId | undefined
}>

/**
 * Menu sur écran étroit (< 768 px, artboard `menu-etroit`) : une barre du haut (marque, bouton
 * « Menu ») qui ouvre le menu déplié dans un tiroir à gauche, sans bouton de repli. Un lien
 * choisi ou Échap le referme ; le focus revient au bouton « Menu », son déclencheur.
 */
export function MenuDrawer({ ui, active }: MenuDrawerProps) {
  const { text } = ui
  const [open, setOpen] = useState(false)
  return (
    <div
      lang={ui.locale}
      className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-sidebar-border bg-sidebar pr-2 pl-4 text-sidebar-foreground md:hidden"
    >
      <div className="flex items-center gap-2.5 font-bold">
        <span
          aria-hidden
          className="block size-7 shrink-0 rounded-[9px] bg-linear-135 from-primary to-action-to"
        />
        {text('menu_brand', {})}
      </div>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger render={<Button variant="ghost" />}>
          <IconMenu2 aria-hidden />
          {text('menu_open', {})}
        </SheetTrigger>
        <SheetContent
          side="left"
          showCloseButton={false}
          lang={ui.locale}
          // Préfixe `data-[side=left]:` : sans lui, `w-3/4` et `sm:max-w-sm` du vendor l'emportent.
          className="gap-5 bg-sidebar px-3 pt-4 pb-5 text-base text-sidebar-foreground data-[side=left]:w-70 data-[side=left]:border-sidebar-border data-[side=left]:sm:max-w-70"
        >
          <SheetTitle className="sr-only">{text('menu_open', {})}</SheetTitle>
          <SheetClose
            render={<Button variant="ghost" size="icon" className="absolute top-2 right-2" />}
            aria-label={text('menu_close', {})}
          >
            <IconX aria-hidden />
          </SheetClose>
          <MenuLinks ui={ui} active={active} collapsed={false} onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  )
}
