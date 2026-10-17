import { NO_VALUE } from '@/components/stats/format-rate'
import { MeterBar } from '@/components/stats/meter-bar'
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

type RateCellProps = Readonly<{ ui: Ui; rate: number | null; color?: string }>

/** Taux d'une ligne : barre décorative teintée par le niveau, arrondie comme le pourcentage écrit. */
export function RateCell({ ui, rate, color }: RateCellProps) {
  return (
    <span className="inline-flex items-center justify-end gap-2.5">
      {rate !== null && (
        <MeterBar value={toPercent(rate) / 100} tone="category" color={color} className="w-16" />
      )}
      <span className="min-w-10.5">{formatPercent(rate, ui.locale)}</span>
    </span>
  )
}
