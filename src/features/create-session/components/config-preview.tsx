import { CategoryBadge } from '@/components/category-badge'
import { ConfigIssueList } from '@/components/config-issue-list'
import { formatScale } from '@/components/format-scale'
import type { NormalizedCategory, NormalizedConfig } from '@/domain/config/normalize'
import type { ValidationResult } from '@/domain/config/validate'
import type { Ui } from '@/lib/i18n/use-ui'
import { PreviewCard, PreviewFigure } from '@/features/create-session/components/preview-card'

type ConfigPreviewProps = Readonly<{
  ui: Ui
  result: ValidationResult
}>

function CategoryRow({ ui, category }: Readonly<{ ui: Ui; category: NormalizedCategory }>) {
  const count = category.questions.length
  return (
    <li className="flex items-center gap-3 border-t py-2">
      <CategoryBadge color={category.color} icon={category.icon} size="sm" />
      <span className="flex min-w-0 flex-1 flex-col wrap-anywhere">
        <span className="text-sm font-semibold">{category.label}</span>
        <span className="text-xs text-muted-foreground">
          {ui.text('preview_category_questions', { count })}
        </span>
      </span>
      <span className="text-small text-muted-foreground tabular-nums">
        {formatScale(category.scale, ui.locale, ' · ')}
      </span>
    </li>
  )
}

function SummaryRow({ term, value }: Readonly<{ term: string; value: string }>) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted-foreground">{term}</dt>
      <dd className="text-right font-medium tabular-nums">{value}</dd>
    </div>
  )
}

function ConfigSummary({ ui, config }: Readonly<{ ui: Ui; config: NormalizedConfig }>) {
  const { text } = ui
  const { exam, scoring, skips } = config
  const meta = [exam.subject, exam.cohort].filter((part) => part !== undefined).join(' · ')
  return (
    <>
      <div className="flex flex-col wrap-anywhere">
        <h3 className="text-h2">{exam.title}</h3>
        {meta !== '' && <span className="text-small text-muted-foreground">{meta}</span>}
      </div>
      <ul>
        {config.categories.map((category) => (
          <CategoryRow key={category.id} ui={ui} category={category} />
        ))}
      </ul>
      <dl className="flex flex-col gap-1.5 border-t pt-3 text-small">
        <SummaryRow
          term={text('preview_questions_per_student', {})}
          value={String(scoring.questionsPerStudent)}
        />
        <SummaryRow
          term={text('preview_scale_label', {})}
          value={text('preview_scale_value', {
            maxRawScore: scoring.maxRawScore,
            finalScale: scoring.finalScale,
          })}
        />
        <SummaryRow
          term={text('preview_rounding_label', {})}
          value={text('preview_rounding_value', scoring.rounding)}
        />
        <SummaryRow
          term={text('preview_skips_label', {})}
          value={
            skips.enabled
              ? text('preview_skips_value', { max: skips.maxPerStudent })
              : text('preview_skips_disabled', {})
          }
        />
      </dl>
    </>
  )
}

/**
 * Aperçu de la config déposée : résumé si elle est valide, sinon nombre d'erreurs à corriger ;
 * puis toutes les issues de F02 (erreurs d'abord), chacune avec son chemin.
 */
export function ConfigPreview({ ui, result }: ConfigPreviewProps) {
  const errors = result.issues.filter((issue) => issue.severity === 'error').length
  return (
    <PreviewCard label={ui.text('preview_config_title', {})} className="gap-3">
      {result.ok ? (
        <ConfigSummary ui={ui} config={result.config} />
      ) : (
        <PreviewFigure
          value={errors}
          noun={ui.text('preview_config_errors', { count: errors })}
          tone="destructive"
        />
      )}
      <ConfigIssueList ui={ui} issues={result.issues} />
    </PreviewCard>
  )
}
