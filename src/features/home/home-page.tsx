import { IconPlus, IconSchool, IconUpload } from '@tabler/icons-react'
import { Link, useNavigate, useRouter } from '@tanstack/react-router'
import { DbStatusBanner } from '@/components/db-status-banner'
import { ImportController } from '@/components/import/import-controller'
import { PageShell } from '@/components/page-shell'
import { Button, buttonVariants } from '@/components/ui/button'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useDbStatus, useSessions, useTrainings } from '@/lib/db/hooks'
import { useUi } from '@/lib/i18n/use-ui'
import { FirstRun } from '@/features/home/components/first-run'
import { PersistenceBadge } from '@/features/home/components/persistence-badge'
import { ResumeSection } from '@/features/home/components/resume-section'
import { SpaceTiles } from '@/features/home/components/space-tiles'
import { recentActivity } from '@/features/home/recent-activity'

/**
 * Accueil en tableau de bord (artboard `accueil`, D103) : « Reprendre » (trois éléments récents),
 * puis les tuiles d'espace ; sans aucune donnée, le premier lancement. Un import réussi mène à `/sessions`, où la session importée est
 * visible même si sa date la laisse hors de « Reprendre » (D106).
 */
export function HomePage() {
  const ui = useUi()
  const { text } = ui
  const status = useDbStatus()
  const sessions = useSessions()
  const trainings = useTrainings()
  const navigate = useNavigate()
  const router = useRouter()
  const open = status === 'open'
  const loaded = sessions !== undefined && trainings !== undefined
  const recent = loaded ? recentActivity(sessions, trainings) : []
  // Aucune donnée, endommagés compris : le premier lancement à la place du tableau de bord.
  const firstRun = open && loaded && sessions.length === 0 && trainings.length === 0
  return (
    <TooltipProvider>
      <ImportController
        ui={ui}
        disabled={!open}
        onImported={() => {
          // Seulement si l'examinateur est resté sur l'accueil pendant l'import (comme la création).
          if (router.state.location.pathname === '/') void navigate({ to: '/sessions' })
        }}
      >
        {(openPicker) =>
          firstRun ? (
            <PageShell
              title={text('first_run_title', {})}
              halo="home"
              meta={
                <>
                  <p>{text('first_run_subtitle', {})}</p>
                  <PersistenceBadge ui={ui} />
                </>
              }
            >
              <FirstRun ui={ui} onImport={openPicker} />
            </PageShell>
          ) : (
            <PageShell
              title={text('menu_home', {})}
              halo="home"
              meta={
                <>
                  <p>{text('home_subtitle', {})}</p>
                  <PersistenceBadge ui={ui} />
                </>
              }
              actions={
                <>
                  <Button variant="ghost" disabled={!open} onClick={openPicker}>
                    <IconUpload aria-hidden />
                    {text('home_import', {})}
                  </Button>
                  {status !== 'unavailable' && (
                    <>
                      <Link to="/training/new" className={buttonVariants({ variant: 'outline' })}>
                        <IconSchool aria-hidden />
                        {text('home_train', {})}
                      </Link>
                      <Link to="/new" className={buttonVariants()}>
                        <IconPlus aria-hidden />
                        {text('home_create', {})}
                      </Link>
                    </>
                  )}
                </>
              }
            >
              {!open && <DbStatusBanner ui={ui} status={status} />}
              {open && loaded && (
                <div className="flex flex-col gap-10">
                  {recent.length > 0 && <ResumeSection ui={ui} items={recent} />}
                  <SpaceTiles
                    ui={ui}
                    sessionCount={sessions.length}
                    trainingCount={trainings.length}
                  />
                </div>
              )}
            </PageShell>
          )
        }
      </ImportController>
    </TooltipProvider>
  )
}
