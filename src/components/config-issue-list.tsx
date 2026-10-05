import { IconAlertTriangle } from '@tabler/icons-react'
import { formatPath, type ConfigIssue } from '@/domain/config/issues'
import { formatConfigIssue } from '@/domain/config/messages'
import type { Ui } from '@/lib/i18n/use-ui'
import { cn } from '@/lib/utils'
import { errorsFirst, keyed } from '@/lib/issue-list'

type ConfigIssueListProps = Readonly<{
  ui: Ui
  issues: readonly ConfigIssue[]
}>

function IssueItem({ ui, issue }: Readonly<{ ui: Ui; issue: ConfigIssue }>) {
  const path = formatPath(issue.path)
  const isError = issue.severity === 'error'
  return (
    <li
      className={cn(
        'flex items-start gap-2',
        isError ? 'text-destructive' : 'text-muted-foreground',
      )}
    >
      {!isError && <IconAlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0" />}
      {path !== '' && <code className="rounded bg-muted px-1 font-mono text-xs">{path}</code>}
      {formatConfigIssue(issue, ui.locale)}
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
    <ul className="flex flex-col gap-1 text-sm">
      {items.map(({ item, key }) => (
        <IssueItem key={key} ui={ui} issue={item} />
      ))}
    </ul>
  )
}
