import { formatBound } from '@/domain/stats/labels'
import type { HistogramBin } from '@/domain/stats/types'
import type { Ui } from '@/lib/i18n/use-ui'

type HistogramBarsProps = Readonly<{
  ui: Ui
  bins: HistogramBin[]
  finalScale: number
  /** Étudiants notés (terminés). */
  count: number
}>

/** Hauteur de la plus haute barre, en rem (artboard `statistiques`). */
const MAX_BAR_REM = 10.5

/** Graduations de l'axe : 0, les quarts et le barème final. */
const TICKS = [0, 0.25, 0.5, 0.75, 1]

const round3 = (value: number): number => Math.round(value * 1000) / 1000

/**
 * Histogramme des notes finales dessiné en barres (artboard `statistiques`) : sans axe Y ni
 * infobulle (D103). Le dessin est caché ; une phrase cite les barres non vides.
 */
export function HistogramBars({ ui, bins, finalScale, count }: HistogramBarsProps) {
  const { text, locale } = ui
  const max = Math.max(...bins.map((bin) => bin.count), 1)
  const described = bins
    .filter((bin) => bin.count > 0)
    .map((bin) =>
      text('stats_histogram_bin', {
        count: bin.count,
        from: formatBound(bin.from, locale),
        to: formatBound(bin.to, locale),
      }),
    )
    .join(', ')
  return (
    <div className="flex min-w-0 flex-[3_1_18.75rem] flex-col gap-2">
      <p className="sr-only">{text('stats_histogram_aria', { count, bins: described })}</p>
      <div aria-hidden="true" className="flex flex-col gap-2">
        <div className="flex h-54 items-end gap-1 border-b">
          {bins.map((bin) => (
            <div
              key={bin.from}
              data-bin
              className="flex min-w-0 flex-1 flex-col items-center justify-end gap-1"
            >
              {bin.count > 0 ? (
                <>
                  <span className="text-label tabular-nums">{bin.count}</span>
                  <span
                    data-bar
                    className="w-full rounded-t-[6px] rounded-b-[2px] bg-primary"
                    style={{ height: `${(bin.count / max) * MAX_BAR_REM}rem` }}
                  />
                </>
              ) : (
                <span className="h-[3px] w-full rounded-[2px] bg-muted" />
              )}
            </div>
          ))}
        </div>
        <div
          data-axis
          className="flex justify-between text-label font-normal text-muted-foreground tabular-nums"
        >
          {TICKS.map((tick) => (
            <span key={tick}>{formatBound(round3(tick * finalScale), locale)}</span>
          ))}
        </div>
      </div>
    </div>
  )
}
