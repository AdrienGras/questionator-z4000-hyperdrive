import { Button } from '@/components/ui/button'
import type { SidePanelTab } from '@/features/session/hooks/use-side-panel'
import type { Ui } from '@/lib/i18n/use-ui'

/**
 * État affiché dans la zone de passage quand l'étudiant actif est marqué absent (§7). Le bouton
 * ouvre le tiroir sur l'onglet « Étudiant », où se trouve « Marquer présent » (F21, F38).
 */
export function AbsentState({
  ui,
  onShowPanel,
}: Readonly<{ ui: Ui; onShowPanel: (tab: SidePanelTab) => void }>) {
  const { text } = ui
  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-lg font-semibold">{text('passage_absent_title', {})}</h2>
      <p className="text-muted-foreground">{text('passage_absent_body', {})}</p>
      <Button variant="outline" className="self-start" onClick={() => onShowPanel('student')}>
        {text('side_panel_show', {})}
      </Button>
    </div>
  )
}
