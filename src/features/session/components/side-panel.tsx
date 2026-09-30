import type { ReactNode, RefObject } from 'react'
import { IconX } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { SidePanelTab } from '@/features/session/side-panel-state'
import type { Ui } from '@/lib/i18n/use-ui'

function isSidePanelTab(value: unknown): value is SidePanelTab {
  return value === 'student' || value === 'students'
}

/**
 * Panneau latéral de l'écran de passage (F21) : tiroir modal à droite, deux onglets. Composant
 * contrôlé : l'ouverture et l'onglet viennent de `useSidePanel` (seul l'onglet est mémorisé).
 * Le contenu est démonté à la fermeture, ce qui flushe le commentaire en attente.
 *
 * `error` : message de la dernière action refusée. Le tiroir modal masque le reste de la page,
 * l'alerte du corps de l'écran y serait invisible : elle est répétée ici, au-dessus des onglets.
 *
 * `returnFocusRef` : élément qui reprend le focus à la fermeture. Le bouton d'ouverture n'est
 * pas un `SheetTrigger`, et un clic ne lui donne pas toujours le focus (Safari) : sans cette
 * ref, le focus retomberait sur le `body`.
 */
export function SidePanel({
  ui,
  open,
  tab,
  onOpenChange,
  onTabChange,
  error,
  returnFocusRef,
  studentTab,
  studentsTab,
}: Readonly<{
  ui: Ui
  open: boolean
  tab: SidePanelTab
  onOpenChange: (open: boolean) => void
  onTabChange: (tab: SidePanelTab) => void
  error?: string
  returnFocusRef?: RefObject<HTMLElement | null>
  studentTab: ReactNode
  studentsTab: ReactNode
}>) {
  const { text } = ui
  const changeTab = (value: unknown) => {
    if (isSidePanelTab(value)) onTabChange(value)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        finalFocus={returnFocusRef}
        // Préfixe `data-[side=right]:` : sans lui, `w-3/4` et `sm:max-w-sm` du vendor (sous ce
        // même variant) l'emporteraient sur `w-full` et `sm:max-w-md`.
        className="gap-0 data-[side=right]:w-full data-[side=right]:sm:max-w-md"
      >
        <SheetHeader className="flex-row items-center justify-between gap-2">
          <SheetTitle>{text('side_panel_label', {})}</SheetTitle>
          <SheetClose
            render={
              <Button variant="ghost" size="icon-sm" aria-label={text('side_panel_close', {})} />
            }
          >
            <IconX aria-hidden />
          </SheetClose>
        </SheetHeader>
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 pb-4">
          {error !== undefined && <p role="alert">{error}</p>}
          <Tabs value={tab} onValueChange={changeTab}>
            <TabsList className="w-full">
              <TabsTrigger value="student" className="flex-1">
                {text('side_panel_tab_student', {})}
              </TabsTrigger>
              <TabsTrigger value="students" className="flex-1">
                {text('side_panel_tab_students', {})}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="student">{studentTab}</TabsContent>
            <TabsContent value="students">{studentsTab}</TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  )
}
