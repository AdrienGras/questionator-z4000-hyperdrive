import { PageShell } from '@/components/page-shell'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useDbStatus, useSessions, useTrainings } from '@/lib/db/hooks'
import { useUi } from '@/lib/i18n/use-ui'
import { ActionCards } from '@/features/home/components/action-cards'
import { HomeActions } from '@/features/home/components/home-actions'
import { ImportController } from '@/features/home/components/import-controller'
import { SessionList } from '@/features/home/components/session-list'
import { TrainingList } from '@/features/home/components/training-list'

/**
 * Accueil (D52, D78) : actions à gauche (24rem dès `lg`) ; à droite, les entraînements (s'il y en a)
 * puis les sessions, en cartes. La langue est détectée une fois ici et passée en prop `ui`.
 */
export function HomePage() {
  const ui = useUi()
  const status = useDbStatus()
  const sessions = useSessions()
  const trainings = useTrainings()
  const showTrainings = status === 'open' && trainings !== undefined && trainings.length > 0
  const importDisabled = status !== 'open'
  return (
    <TooltipProvider>
      <ImportController ui={ui} disabled={importDisabled}>
        {(openPicker) => (
          <PageShell ui={ui} title={ui.text('app_title', {})} actions={<HomeActions ui={ui} />}>
            <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[24rem_minmax(0,1fr)] lg:items-start">
              <ActionCards
                ui={ui}
                storageAvailable={status !== 'unavailable'}
                importDisabled={importDisabled}
                onImport={openPicker}
              />
              <div className="flex min-w-0 flex-col gap-6">
                {showTrainings && (
                  <section aria-labelledby="home-trainings-title" className="flex flex-col gap-4">
                    <h2 id="home-trainings-title" className="text-xl font-semibold">
                      {ui.text('home_trainings_title', {})}
                    </h2>
                    <TrainingList ui={ui} trainings={trainings} />
                  </section>
                )}
                <section aria-labelledby="home-sessions-title">
                  <h2 id="home-sessions-title" className="sr-only">
                    {ui.text('home_sessions_title', {})}
                  </h2>
                  <SessionList ui={ui} status={status} sessions={sessions} />
                </section>
              </div>
            </div>
          </PageShell>
        )}
      </ImportController>
    </TooltipProvider>
  )
}
