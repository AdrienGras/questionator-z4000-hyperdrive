import { Link } from '@tanstack/react-router'
import { exportBackup } from '@/components/export/export-backup'
import { Button } from '@/components/ui/button'
import { formatBackupIssue, formatIssuePath } from '@/domain/backup/messages'
import type { DamagedSession } from '@/lib/db/damaged-session'
import type { Ui } from '@/lib/i18n/use-ui'

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

const MAIN_CLASSES = 'flex min-h-svh flex-col items-center justify-center gap-4 p-6 text-center'

/**
 * Session endommagée (F31, D81), dans la langue et le thème de l'interface : la config n'est pas
 * fiable. Vue projetée : le titre seul, rien à exporter ni à lire devant l'étudiant.
 */
export function DamagedSessionScreen(props: DamagedSessionScreenProps) {
  const { text, locale } = props.ui
  const title = <h1 className="text-2xl font-bold">{text('damaged_title', {})}</h1>
  if (props.variant === 'present') return <main className={MAIN_CLASSES}>{title}</main>
  const { damaged } = props
  return (
    <main className={MAIN_CLASSES}>
      {title}
      <p className="max-w-xl text-muted-foreground">{text('damaged_body', {})}</p>
      <Button variant="outline" onClick={() => exportBackup(damaged.raw)}>
        {text('action_export', {})}
      </Button>
      <Link to="/" className="text-primary underline underline-offset-4">
        {text('back_home', {})}
      </Link>
      <details className="w-full max-w-xl text-left text-sm">
        <summary className="cursor-pointer text-center">{text('damaged_details', {})}</summary>
        <ul className="mt-3 flex flex-col gap-2">
          {damaged.issues.map((issue, index) => {
            const path = formatIssuePath(issue)
            const message = formatBackupIssue(issue, locale)
            return (
              <li key={`${index}|${path}|${message}`} className="flex flex-col gap-0.5">
                {path !== '' && <code className="text-muted-foreground">{path}</code>}
                <span>{message}</span>
              </li>
            )
          })}
        </ul>
      </details>
    </main>
  )
}
