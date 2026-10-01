import { PageShell } from '@/components/page-shell'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useDbStatus, useSessions } from '@/lib/db/hooks'
import { useUi } from '@/lib/i18n/use-ui'
import { ActionCards } from '@/features/home/components/action-cards'
import { HomeActions } from '@/features/home/components/home-actions'
import { ImportController } from '@/features/home/components/import-controller'
import { SessionList } from '@/features/home/components/session-list'

/** Accueil (D52, D78) : actions à gauche (24rem dès `lg`), sessions en cartes à droite. La langue est détectée une fois ici et passée en prop `ui`. */
export function HomePage() {
  const ui = useUi()
  const status = useDbStatus()
  const sessions = useSessions()
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
              <section aria-labelledby="home-sessions-title">
                <h2 id="home-sessions-title" className="sr-only">
                  {ui.text('home_sessions_title', {})}
                </h2>
                <SessionList ui={ui} status={status} sessions={sessions} />
              </section>
            </div>
          </PageShell>
        )}
      </ImportController>
    </TooltipProvider>
  )
}
