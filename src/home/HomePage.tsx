import { TooltipProvider } from '@/components/ui/tooltip'
import { useDbStatus, useSessions } from '@/db'
import { useUi } from '@/i18n/use-ui'
import { HomeHeader } from './HomeHeader'
import { ImportController } from './ImportController'
import { SessionList } from './SessionList'

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
