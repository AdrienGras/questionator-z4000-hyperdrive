import { ConfigIssueList } from '@/components/config-issue-list'
import type { NormalizedConfig } from '@/domain/config/normalize'
import type { ValidationResult } from '@/domain/config/validate'
import type { Ui } from '@/lib/i18n/use-ui'

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

/**
 * Aperçu de la config déposée : résumé si elle est valide, puis toutes les issues de F02
 * (erreurs d'abord), chacune avec son chemin.
 */
export function ConfigPreview({ ui, result }: ConfigPreviewProps) {
  return (
    <div className="flex flex-col gap-2">
      {result.ok ? (
        <ConfigSummary ui={ui} config={result.config} />
      ) : (
        <h3 className="font-semibold">{ui.text('preview_config_title', {})}</h3>
      )}
      <ConfigIssueList ui={ui} issues={result.issues} />
    </div>
  )
}
