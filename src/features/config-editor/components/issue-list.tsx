import { formatPath, type ConfigIssue } from '@/domain/config/issues'
import { formatConfigIssue } from '@/domain/config/messages'
import type { Ui } from '@/lib/i18n/use-ui'
import { cn } from '@/lib/utils'

type IssueListProps = Readonly<{
  ui: Ui
  issues: readonly ConfigIssue[]
  onSelect: (issue: ConfigIssue) => void
}>

/** Issues de validation, erreurs d'abord puis avertissements ; chaque ligne mène à sa position dans le texte. */
export function IssueList({ ui, issues, onSelect }: IssueListProps) {
  const errors = issues.filter((issue) => issue.severity === 'error')
  const warnings = issues.filter((issue) => issue.severity === 'warning')
  if (issues.length === 0) return <p className="text-sm">{ui.text('editor_issues_none', {})}</p>
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">
        {ui.text('editor_issues_count', { errors: errors.length, warnings: warnings.length })}
      </p>
      <ul className="space-y-1">
        {[...errors, ...warnings].map((issue, index) => (
          // Les issues n'ont pas d'identité propre : le rang dans la liste triée suffit.
          // oxlint-disable-next-line react/no-array-index-key
          <li key={`${issue.code}-${formatPath(issue.path)}-${index}`}>
            <button
              type="button"
              onClick={() => onSelect(issue)}
              className={cn(
                'w-full rounded-md border-l-4 px-2 py-1 text-left text-sm hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                issue.severity === 'error' ? 'border-destructive' : 'border-amber-500',
              )}
            >
              <span className="block">{formatConfigIssue(issue, ui.locale)}</span>
              <span className="block font-mono text-xs text-muted-foreground">
                {formatPath(issue.path)}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
