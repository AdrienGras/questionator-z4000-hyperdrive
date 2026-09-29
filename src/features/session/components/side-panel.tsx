import { useId, useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  readSidePanelOpen,
  readSidePanelTab,
  writeSidePanelOpen,
  writeSidePanelTab,
  type SidePanelTab,
} from '@/features/session/side-panel-state'
import type { Ui } from '@/lib/i18n/use-ui'

function isSidePanelTab(value: unknown): value is SidePanelTab {
  return value === 'student' || value === 'students'
}

/**
 * Panneau latéral de l'écran de passage : deux onglets, repliable. L'état (ouvert, onglet) est
 * mémorisé dans `localStorage` par `side-panel-state` ; le panneau replié ne rend que le bouton.
 */
export function SidePanel({
  ui,
  studentTab,
  studentsTab,
}: Readonly<{ ui: Ui; studentTab: ReactNode; studentsTab: ReactNode }>) {
  const { text } = ui
  const contentId = useId()
  const [open, setOpen] = useState(readSidePanelOpen)
  const [tab, setTab] = useState<SidePanelTab>(readSidePanelTab)

  const toggle = () => {
    writeSidePanelOpen(!open)
    setOpen(!open)
  }
  const changeTab = (value: unknown) => {
    if (!isSidePanelTab(value)) return
    writeSidePanelTab(value)
    setTab(value)
  }

  return (
    <aside
      aria-label={text('side_panel_label', {})}
      className={open ? 'flex flex-col gap-3 lg:w-[22rem]' : 'flex flex-col gap-3'}
    >
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="self-end"
        aria-expanded={open}
        aria-controls={open ? contentId : undefined}
        onClick={toggle}
      >
        {text(open ? 'side_panel_hide' : 'side_panel_show', {})}
      </Button>
      {open && (
        <div id={contentId}>
          <Tabs value={tab} onValueChange={changeTab}>
            <TabsList>
              <TabsTrigger value="student">{text('side_panel_tab_student', {})}</TabsTrigger>
              <TabsTrigger value="students">{text('side_panel_tab_students', {})}</TabsTrigger>
            </TabsList>
            <TabsContent value="student">{studentTab}</TabsContent>
            <TabsContent value="students">{studentsTab}</TabsContent>
          </Tabs>
        </div>
      )}
    </aside>
  )
}
