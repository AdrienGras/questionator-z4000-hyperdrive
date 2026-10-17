import { IconAlertTriangle, IconCircleX } from '@tabler/icons-react'
import { formatPath, type ConfigIssue } from '@/domain/config/issues'
import { formatConfigIssue } from '@/domain/config/messages'
import type { Ui } from '@/lib/i18n/use-ui'

/** Issue et sa ligne dans le texte validé (base 1). */
export type LocatedIssue = { issue: ConfigIssue; line: number }

type IssueListProps = Readonly<{
  ui: Ui
  issues: readonly LocatedIssue[]
  onSelect: (issue: ConfigIssue) => void
}>

/**
 * Panneau « Problèmes » (artboard `editeur-config`) : erreurs d'abord puis avertissements, chacun
 * avec son chemin et sa ligne ; un clic mène à sa position dans le texte.
 */
export function IssueList({ ui, issues, onSelect }: IssueListProps) {
  const errors = issues.filter(({ issue }) => issue.severity === 'error')
  const warnings = issues.filter(({ issue }) => issue.severity === 'warning')
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-small font-semibold">{ui.text('editor_issues_title', {})}</h2>
        <span className="text-small text-muted-foreground tabular-nums">
          {issues.length === 0
            ? ui.text('editor_issues_none', {})
            : ui.text('editor_issues_count', { errors: errors.length, warnings: warnings.length })}
        </span>
      </div>
      {issues.length > 0 && (
        <ul className="max-h-48 overflow-auto">
          {[...errors, ...warnings].map(({ issue, line }, index) => {
            const isError = issue.severity === 'error'
            const SeverityIcon = isError ? IconCircleX : IconAlertTriangle
            return (
              // Les issues n'ont pas d'identité propre : le rang dans la liste triée suffit.
              // oxlint-disable-next-line react/no-array-index-key
              <li key={`${issue.code}-${formatPath(issue.path)}-${index}`}>
                <button
                  type="button"
                  onClick={() => onSelect(issue)}
                  className="flex w-full items-start gap-2.5 rounded-md px-3 py-2.5 text-left text-sm hover:bg-accent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
                >
                  <SeverityIcon
                    aria-hidden
                    className={`mt-0.5 size-4 shrink-0 ${isError ? 'text-destructive' : 'text-muted-foreground'}`}
                  />
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5 wrap-anywhere">
                    <span>{formatConfigIssue(issue, ui.locale)}</span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {formatPath(issue.path)}
                    </span>
                  </span>
                  <span className="text-xs whitespace-nowrap text-muted-foreground tabular-nums">
                    {ui.text('editor_issue_line', { line })}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
