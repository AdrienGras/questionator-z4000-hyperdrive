import { TooltipProvider } from '@/components/ui/tooltip'
import { useDbStatus, useSessions } from '@/lib/db/hooks'
import { useUi } from '@/lib/i18n/use-ui'
import { HomeHeader } from '@/features/home/components/home-header'
import { ImportController } from '@/features/home/components/import-controller'
import { SessionList } from '@/features/home/components/session-list'

/** Accueil (D52) : sessions en cartes. La langue est détectée une fois ici et passée en prop `ui`. */
export function HomePage() {
  const ui = useUi()
  const status = useDbStatus()
  const sessions = useSessions()
  const importDisabled = status !== 'open'
  return (
    <TooltipProvider>
      <ImportController ui={ui} disabled={importDisabled}>
        {(openPicker) => (
          <main className="mx-auto flex min-h-svh max-w-3xl flex-col gap-6 p-4 sm:p-6">
            <HomeHeader
              ui={ui}
              storageAvailable={status !== 'unavailable'}
              importDisabled={importDisabled}
              onImport={openPicker}
            />
            <SessionList ui={ui} status={status} sessions={sessions} onImport={openPicker} />
          </main>
        )}
      </ImportController>
    </TooltipProvider>
  )
}
