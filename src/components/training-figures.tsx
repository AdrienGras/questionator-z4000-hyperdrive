import { formatRate } from '@/components/stats/format-rate'
import { SuccessRing } from '@/components/success-ring'
import type { TrainingSummary } from '@/hooks/use-training-summary'
import type { Ui } from '@/lib/i18n/use-ui'

type TrainingFiguresProps = Readonly<{
  ui: Ui
  summary: TrainingSummary
  /** Questions notées sur le total, à côté du taux (cartes de la page Entraînement). */
  showCoverage: boolean
}>

const LABEL_CLASS = 'text-[13px] leading-[18px] text-muted-foreground'

/** Chiffres d'un entraînement : anneau et taux de réussite, puis la couverture si demandée. */
export function TrainingFigures({ ui, summary, showCoverage }: TrainingFiguresProps) {
  const { locale, text } = ui
  const rate = formatRate(summary.rate, locale)
  return (
    <div className="flex items-center gap-5">
      <SuccessRing rate={summary.rate} label={text('training_success_aria', { rate })} />
      <div className="flex flex-wrap gap-x-7 gap-y-2">
        <p className="flex flex-col">
          <span className="text-score-md tabular-nums">{rate}</span>
          <span className={LABEL_CLASS}>{text('training_success_label', {})}</span>
        </p>
        {showCoverage && (
          <p className="flex flex-col">
            <span className="text-score-md tabular-nums">
              {summary.coverage.covered}
              <span className="text-lg leading-none font-semibold text-muted-foreground">
                {` / ${summary.coverage.total}`}
              </span>
            </span>
            <span className={LABEL_CLASS}>{text('training_coverage_label', {})}</span>
          </p>
        )}
      </div>
    </div>
  )
}
