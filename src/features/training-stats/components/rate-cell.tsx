import { NO_VALUE } from '@/components/stats/format-rate'
import { Progress } from '@/components/ui/progress'
import type { Locale } from '@/lib/i18n/i18n'
import type { Ui } from '@/lib/i18n/use-ui'

/**
 * Taux en pourcentage entier. Arrondi en deux temps : `0.145 * 100` vaut `14.499…` en
 * flottant, on passe donc par les millièmes (`145`) avant d'arrondir à l'unité.
 */
function toPercent(rate: number): number {
  return Math.round(Math.round(rate * 1000) / 10)
}

/** Taux en pourcentage entier (voir `toPercent`), « — » sans note. */
export function formatPercent(rate: number | null, locale: Locale): string {
  if (rate === null) return NO_VALUE
  return new Intl.NumberFormat(locale, { style: 'percent' }).format(toPercent(rate) / 100)
}

type RateCellProps = Readonly<{ ui: Ui; label: string; rate: number | null }>

/** Taux d'une ligne : barre `Progress` nommée « libellé : taux », puis le pourcentage. */
export function RateCell({ ui, label, rate }: RateCellProps) {
  const text = formatPercent(rate, ui.locale)
  return (
    <span className="inline-flex items-center justify-end gap-2">
      {rate !== null && (
        <Progress
          value={toPercent(Math.min(Math.max(rate, 0), 1))}
          aria-label={ui.text('training_stats_rate_label', { label, rate: text })}
          className="w-16 shrink-0"
        />
      )}
      {/* Avec une barre, son nom porte déjà le taux : le texte visible n'est pas relu. */}
      <span className="min-w-[3.5ch]" aria-hidden={rate === null ? undefined : true}>
        {text}
      </span>
    </span>
  )
}
