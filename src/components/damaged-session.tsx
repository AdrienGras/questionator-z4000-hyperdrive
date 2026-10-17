import { IconAlertTriangle, IconDownload } from '@tabler/icons-react'
import { Link } from '@tanstack/react-router'
import { exportBackup } from '@/components/export/export-backup'
import { STATUS_MAIN_CLASS, StatusScreen } from '@/components/status-screen'
import { Button, buttonVariants } from '@/components/ui/button'
import { formatBackupIssue, formatIssuePath } from '@/domain/backup/messages'
import type { DamagedSession } from '@/lib/db/damaged-session'
import type { Ui } from '@/lib/i18n/use-ui'
import { cn } from '@/lib/utils'

/**
 * La vue projetée ne reçoit jamais le contenu de la session (D69) : `damaged` y est facultatif,
 * `useProjectedView` ne remonte que `'damaged'`.
 */
type DamagedSessionScreenProps = Readonly<
  { ui: Ui } & (
    | { variant: 'examiner'; damaged: DamagedSession }
    | { variant: 'present'; damaged?: DamagedSession }
  )
>

const DANGER_TILE_CLASS =
  'inline-flex size-14 shrink-0 items-center justify-center rounded-md bg-destructive/14 text-destructive'

/**
 * Session endommagée (F31, D81), dans la langue et le thème de l'interface : la config n'est pas
 * fiable. Vue projetée : le titre seul, rien à exporter ni à lire devant l'étudiant.
 */
export function DamagedSessionScreen(props: DamagedSessionScreenProps) {
  const { text, locale } = props.ui
  const title = text('damaged_title', {})
  if (props.variant === 'present') {
    return (
      <main className={cn(STATUS_MAIN_CLASS, 'relative isolate overflow-hidden')}>
        <div
          aria-hidden
          className="absolute top-1/2 left-1/2 -z-10 h-70 w-105 -translate-1/2 bg-[radial-gradient(closest-side,var(--color-halo-cool),transparent)] blur-sm"
        />
        <span aria-hidden className={DANGER_TILE_CLASS}>
          <IconAlertTriangle className="size-7" />
        </span>
        <h1 className="text-3xl font-extrabold tracking-tight">{title}</h1>
      </main>
    )
  }
  const { damaged } = props
  return (
    <StatusScreen tone="danger" icon={<IconAlertTriangle />} title={title}>
      <p className="max-w-110 text-muted-foreground">{text('damaged_body', {})}</p>
      <div className="mt-1 flex flex-wrap justify-center gap-2">
        <Button onClick={() => exportBackup(damaged.raw)}>
          <IconDownload aria-hidden />
          {text('action_export', {})}
        </Button>
        {/* Sa carte, avec export et suppression, est sur la page Sessions (l'accueil exclut les endommagées). */}
        <Link to="/sessions" className={buttonVariants({ variant: 'ghost' })}>
          {text('back_sessions', {})}
        </Link>
      </div>
      <details className="mt-2 w-full max-w-120 rounded-lg bg-card px-4.5 py-3.5 text-left text-sm shadow-card">
        <summary className="cursor-pointer font-semibold">
          {text('damaged_details', { count: damaged.issues.length })}
        </summary>
        <ul className="mt-2.5">
          {damaged.issues.map((issue, index) => {
            const path = formatIssuePath(issue)
            const message = formatBackupIssue(issue, locale)
            return (
              <li key={`${index}|${path}|${message}`} className="flex flex-col gap-1 border-t py-3">
                {path !== '' && (
                  <code className="font-mono text-xs text-muted-foreground">{path}</code>
                )}
                <span>{message}</span>
              </li>
            )
          })}
        </ul>
      </details>
    </StatusScreen>
  )
}
