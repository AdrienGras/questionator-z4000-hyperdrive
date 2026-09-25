import { IconAlertTriangle } from '@tabler/icons-react'
import { formatPath, type ConfigIssue } from '@/config/issues'
import { formatConfigIssue } from '@/config/messages'
import type { NormalizedConfig } from '@/config/normalize'
import type { ValidationResult } from '@/config/validate'
import type { Ui } from '@/i18n/use-ui'
import { cn } from '@/lib/utils'
import { errorsFirst, keyed } from './issue-list'

type ConfigPreviewProps = Readonly<{
  ui: Ui
  result: ValidationResult
}>

function ConfigSummary({ ui, config }: Readonly<{ ui: Ui; config: NormalizedConfig }>) {
  const { text } = ui
  const { exam, scoring, skips } = config
  return (
    <>
      <h3 className="font-semibold">{exam.title}</h3>
      {exam.subject !== undefined && (
        <p className="text-sm">{text('preview_subject', { subject: exam.subject })}</p>
      )}
      {exam.cohort !== undefined && (
        <p className="text-sm">{text('preview_cohort', { cohort: exam.cohort })}</p>
      )}
      <ul className="list-disc pl-6 text-sm">
        {config.categories.map((category) => (
          <li key={category.id}>
            {text('preview_category', {
              label: category.label,
              questions: category.questions.length,
              scale: category.scale.join(', '),
            })}
          </li>
        ))}
      </ul>
      <p className="text-sm">
        {text('preview_scoring', {
          questionsPerStudent: scoring.questionsPerStudent,
          maxRawScore: scoring.maxRawScore,
          finalScale: scoring.finalScale,
        })}
      </p>
      <p className="text-sm">{text('preview_rounding', scoring.rounding)}</p>
      <p className="text-sm">
        {skips.enabled
          ? text('preview_skips', { max: skips.maxPerStudent })
          : text('preview_skips_disabled', {})}
      </p>
    </>
  )
}

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
 * Aperçu de la config déposée : résumé si elle est valide, puis toutes les issues de F02
 * (erreurs d'abord), chacune avec son chemin.
 */
export function ConfigPreview({ ui, result }: ConfigPreviewProps) {
  const issues = keyed(
    errorsFirst(result.issues),
    (issue) => `${formatPath(issue.path)}|${issue.code}`,
  )
  return (
    <div className="flex flex-col gap-2">
      {result.ok ? (
        <ConfigSummary ui={ui} config={result.config} />
      ) : (
        <h3 className="font-semibold">{ui.text('preview_config_title', {})}</h3>
      )}
      {issues.length > 0 && (
        <ul className="flex flex-col gap-1 text-sm">
          {issues.map(({ item, key }) => (
            <IssueItem key={key} ui={ui} issue={item} />
          ))}
        </ul>
      )}
    </div>
  )
}
