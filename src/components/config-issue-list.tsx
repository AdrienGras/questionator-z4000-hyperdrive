import { IconAlertTriangle, IconCircleX } from '@tabler/icons-react'
import { formatPath, type ConfigIssue } from '@/domain/config/issues'
import { formatConfigIssue } from '@/domain/config/messages'
import type { Ui } from '@/lib/i18n/use-ui'
import { errorsFirst, keyed } from '@/lib/issue-list'

type ConfigIssueListProps = Readonly<{
  ui: Ui
  issues: readonly ConfigIssue[]
}>

const PATH_CLASS = 'font-mono text-xs'

/** Erreur (artboard `creation-avertissements`) : libellé « Erreur », chemin en pastille, message. */
function ErrorItem({ ui, issue, path }: Readonly<{ ui: Ui; issue: ConfigIssue; path: string }>) {
  return (
    <li className="flex flex-col gap-1.5 text-small text-destructive">
      <span className="flex items-center gap-1.5 font-semibold">
        <IconCircleX aria-hidden className="size-4 shrink-0" />
        {ui.text('issue_error_label', {})}
      </span>
      {path !== '' && (
        <code
          className={`${PATH_CLASS} self-start rounded-sm bg-muted px-1.5 py-0.5 text-foreground`}
        >
          {path}
        </code>
      )}
      <span className="text-foreground">{formatConfigIssue(issue, ui.locale)}</span>
    </li>
  )
}

function WarningItem({ ui, issue, path }: Readonly<{ ui: Ui; issue: ConfigIssue; path: string }>) {
  return (
    <li className="flex items-start gap-2 text-small text-muted-foreground">
      <IconAlertTriangle aria-hidden className="mt-px size-4 shrink-0" />
      <span className="flex min-w-0 flex-col gap-0.5">
        <span>{formatConfigIssue(issue, ui.locale)}</span>
        {path !== '' && <code className={PATH_CLASS}>{path}</code>}
      </span>
    </li>
  )
}

/**
 * Issues d'une config (F02), erreurs d'abord, chacune avec son chemin. Rien n'est rendu s'il n'y
 * en a aucune.
 */
export function ConfigIssueList({ ui, issues }: ConfigIssueListProps) {
  const items = keyed(errorsFirst(issues), (issue) => `${formatPath(issue.path)}|${issue.code}`)
  if (items.length === 0) return null
  return (
    <ul className="flex flex-col gap-3 border-t pt-3 wrap-anywhere">
      {items.map(({ item, key }) => {
        const path = formatPath(item.path)
        return item.severity === 'error' ? (
          <ErrorItem key={key} ui={ui} issue={item} path={path} />
        ) : (
          <WarningItem key={key} ui={ui} issue={item} path={path} />
        )
      })}
    </ul>
  )
}
