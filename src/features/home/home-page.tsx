import { PageShell } from '@/components/page-shell'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ImportController } from '@/components/import/import-controller'
import { useDbStatus } from '@/lib/db/hooks'
import { useUi } from '@/lib/i18n/use-ui'
import { ActionCards } from '@/features/home/components/action-cards'
import { HomeActions } from '@/features/home/components/home-actions'

/**
 * Accueil provisoire (#147) : les cartes d'action seules, les listes vivent sur `/sessions` et
 * `/trainings` ; le tableau de bord remplace cette page à la tâche suivante.
 */
export function HomePage() {
  const ui = useUi()
  const status = useDbStatus()
  const importDisabled = status !== 'open'
  return (
    <TooltipProvider>
      <ImportController ui={ui} disabled={importDisabled}>
        {(openPicker) => (
          <PageShell title={ui.text('app_title', {})} actions={<HomeActions ui={ui} />}>
            <ActionCards
              ui={ui}
              storageAvailable={status !== 'unavailable'}
              importDisabled={importDisabled}
              onImport={openPicker}
            />
          </PageShell>
        )}
      </ImportController>
    </TooltipProvider>
  )
}
