import { IconPlus, IconUpload } from '@tabler/icons-react'
import { Link } from '@tanstack/react-router'
import { ImportController } from '@/components/import/import-controller'
import { PageShell } from '@/components/page-shell'
import { SpaceIcon } from '@/components/space-icon'
import { Button, buttonVariants } from '@/components/ui/button'
import { useDbStatus, useSessions } from '@/lib/db/hooks'
import { useUi } from '@/lib/i18n/use-ui'
import { SessionList } from '@/features/sessions/components/session-list'

/**
 * Page de l'espace Sessions (artboard `sessions`, #147) : création, restauration d'une sauvegarde
 * par bouton ou par dépôt n'importe où sur la page, puis la liste, endommagées comprises.
 */
export function SessionsPage() {
  const ui = useUi()
  const { text } = ui
  const status = useDbStatus()
  const sessions = useSessions()
  const open = status === 'open'
  return (
    <ImportController ui={ui} disabled={!open}>
      {(openPicker) => (
        <PageShell
          title={text('menu_sessions', {})}
          icon={<SpaceIcon space="sessions" size="lg" />}
          meta={text('sessions_subtitle', {})}
          halo="space"
          actions={
            <>
              <Button variant="outline" disabled={!open} onClick={openPicker}>
                <IconUpload aria-hidden />
                {text('home_import', {})}
              </Button>
              {status !== 'unavailable' && (
                <Link to="/new" className={buttonVariants()}>
                  <IconPlus aria-hidden />
                  {text('home_create', {})}
                </Link>
              )}
            </>
          }
        >
          {open && (
            <p className="flex items-center gap-2.5 rounded-md border border-dashed border-input px-4 py-3 text-[13px] leading-[18px] text-muted-foreground">
              <IconUpload aria-hidden className="size-4 shrink-0" />
              {text('sessions_drop_hint', {})}
            </p>
          )}
          <section aria-labelledby="sessions-list-title" className="flex flex-col gap-3">
            <h2 id="sessions-list-title" className="sr-only">
              {text('sessions_list_title', {})}
            </h2>
            <SessionList ui={ui} status={status} sessions={sessions} />
          </section>
        </PageShell>
      )}
    </ImportController>
  )
}
