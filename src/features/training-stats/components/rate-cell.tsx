import { NO_VALUE } from '@/components/stats/format-rate'
import { Progress } from '@/components/ui/progress'
import type { Locale } from '@/lib/i18n/i18n'
import type { Ui } from '@/lib/i18n/use-ui'

/** Taux en pourcentage entier (`Math.round(rate * 100)`), « — » sans note. */
export function formatPercent(rate: number | null, locale: Locale): string {
  if (rate === null) return NO_VALUE
  return new Intl.NumberFormat(locale, { style: 'percent' }).format(Math.round(rate * 100) / 100)
}

type RateCellProps = Readonly<{ ui: Ui; label: string; rate: number | null }>

/** Taux d'une ligne : barre `Progress` nommée « libellé : taux », puis le pourcentage. */
export function RateCell({ ui, label, rate }: RateCellProps) {
  const text = formatPercent(rate, ui.locale)
  return (
    <span className="inline-flex items-center justify-end gap-2">
      {rate !== null && (
        <Progress
          value={Math.round(Math.min(Math.max(rate, 0), 1) * 100)}
          aria-label={ui.text('training_stats_rate_label', { label, rate: text })}
          className="w-16 shrink-0"
        />
      )}
      <span className="min-w-[3.5ch]">{text}</span>
    </span>
  )
}
