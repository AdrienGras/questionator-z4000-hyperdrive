import type { ReactNode, RefObject } from 'react'
import { IconX } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useFreshError, type Failure } from '@/features/session/hooks/use-fresh-error'
import type { SidePanelTab } from '@/features/session/hooks/use-side-panel'
import type { Ui } from '@/lib/i18n/use-ui'

// Bascule à deux positions (artboard `passage-panneau`) : l'onglet actif en carte.
const TAB =
  'h-9 flex-1 rounded-[9px] text-sm font-semibold text-muted-foreground data-active:bg-card data-active:text-foreground data-active:shadow-card'

function isSidePanelTab(value: unknown): value is SidePanelTab {
  return value === 'student' || value === 'students'
}

/**
 * Panneau latéral de l'écran de passage (F21, artboards `passage-panneau*`) : tiroir modal à
 * droite, nommé par la session sous le sur-titre « Panneau », deux onglets et un pied commun. Composant
 * contrôlé : l'ouverture et l'onglet viennent de `useSidePanel` (rien n'est mémorisé, D91).
 * Le contenu est démonté à la fermeture, ce qui flushe le commentaire en attente.
 *
 * `error` : dernière action refusée, montrée seulement si elle survient tiroir ouvert (une erreur
 * déjà là à l'ouverture est périmée, la page l'affiche). Le tiroir modal masque le reste de la page,
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
  title,
  studentTab,
  studentsTab,
  footer,
}: Readonly<{
  ui: Ui
  open: boolean
  tab: SidePanelTab
  onOpenChange: (open: boolean) => void
  onTabChange: (tab: SidePanelTab) => void
  error?: Failure
  returnFocusRef?: RefObject<HTMLElement | null>
  /** Nom de la session, en titre du tiroir. */
  title: string
  studentTab: ReactNode
  studentsTab: ReactNode
  /** Pied commun aux deux onglets : statistiques et export. */
  footer: ReactNode
}>) {
  const { text } = ui
  const freshError = useFreshError(error, open)
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
        // même variant) l'emporteraient sur `w-full` et `sm:max-w-110`.
        className="gap-5 bg-popover p-6 data-[side=right]:w-full data-[side=right]:sm:max-w-110"
      >
        <SheetHeader className="flex-row items-start justify-between gap-3 p-0">
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="text-label text-muted-foreground uppercase">
              {text('side_panel_label', {})}
            </span>
            <SheetTitle className="text-h2 wrap-anywhere">{title}</SheetTitle>
          </div>
          <SheetClose
            render={
              <Button variant="ghost" size="icon-sm" aria-label={text('side_panel_close', {})} />
            }
          >
            <IconX aria-hidden />
          </SheetClose>
        </SheetHeader>
        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto">
          {freshError !== undefined && <p role="alert">{freshError.message}</p>}
          <Tabs value={tab} onValueChange={changeTab} className="gap-5">
            <TabsList
              aria-label={text('side_panel_label', {})}
              className="h-auto w-full rounded-md bg-muted p-1"
            >
              <TabsTrigger value="student" className={TAB}>
                {text('side_panel_tab_student', {})}
              </TabsTrigger>
              <TabsTrigger value="students" className={TAB}>
                {text('side_panel_tab_students', {})}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="student">{studentTab}</TabsContent>
            <TabsContent value="students">{studentsTab}</TabsContent>
          </Tabs>
          <div className="mt-auto flex flex-wrap gap-2 border-t pt-4">{footer}</div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
