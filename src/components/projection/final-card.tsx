import { useId } from 'react'
import { CategoryBadge } from '@/components/category-badge'
import { ScoreGauge } from '@/components/score-gauge'
import type { ProjectedStudentView } from '@/domain/presentation/projected-view'
import { formatFixed, formatRawScore } from '@/domain/scoring/format'
import { toMilli } from '@/domain/scoring/milli'
import type { Ui } from '@/lib/i18n/use-ui'

type DetailRow = NonNullable<ProjectedStudentView['detail']>[number]
type Final = NonNullable<ProjectedStudentView['final']>

/** « Passée », ou « points / max » ; notée sans note (donnée incohérente) : « — », jamais inventée. */
function rowScore(row: DetailRow, ui: Ui): string {
  if (row.skipped) return ui.text('present_skipped', {})
  const max = formatRawScore(toMilli(row.maxPoints), ui.locale)
  const points = row.points === undefined ? '—' : formatRawScore(toMilli(row.points), ui.locale)
  return `${points} / ${max}`
}

/** Note finale en jauge (aux décimales de l'arrondi de la config, D103), puis le score brut. */
function Grade({ ui, final }: Readonly<{ ui: Ui; final: Final }>) {
  const scale = formatRawScore(toMilli(final.scale), ui.locale)
  const raw = final.raw === undefined ? undefined : formatRawScore(toMilli(final.raw), ui.locale)
  if (final.final === undefined) {
    // Brute seule (`finalScoreDisplay: 'raw'`) : en grand, sans jauge (pas de maximum projeté).
    return (
      <div className="flex flex-col items-center gap-2">
        <span className="text-[1.5625rem] font-semibold tracking-[.08em] text-muted-foreground uppercase">
          {ui.text('present_raw_label', {})}
        </span>
        <span className="text-[7.75rem] leading-none font-extrabold tracking-[-0.04em] tabular-nums">
          {raw}
        </span>
      </div>
    )
  }
  const value = formatFixed(toMilli(final.final), final.decimals, ui.locale)
  return (
    <div className="flex flex-col items-center gap-7">
      <ScoreGauge
        size="lg"
        ratio={final.final / final.scale}
        label={ui.text('present_gauge_label', { value, scale })}
      >
        <span className="text-[1.5625rem] font-semibold tracking-[.08em] text-muted-foreground uppercase">
          {ui.text('present_note_label', {})}
        </span>
        <span className="flex items-baseline gap-2.5 tabular-nums">
          <span className="text-[7.75rem] leading-[7.25rem] font-extrabold tracking-[-0.04em]">
            {value}
          </span>
          <span className="text-5xl font-bold text-muted-foreground">{`/ ${scale}`}</span>
        </span>
      </ScoreGauge>
      {raw !== undefined && (
        <p className="text-[2rem] leading-10 text-muted-foreground">
          {ui.text('present_raw_label', {})}{' '}
          <b className="font-bold text-foreground tabular-nums">{raw}</b>
        </p>
      )}
    </div>
  )
}

/**
 * Écran final projeté (artboards `projection-finale`, `projection-finale-detail`) : note en jauge
 * et score brut ; avec le détail, deux colonnes, chaque question avec la couleur et l'icône de sa
 * catégorie (lues dans `categories` par `categoryId`, D103).
 */
export function FinalCard({
  ui,
  final,
  detail,
  categories,
}: Readonly<{
  ui: Ui
  final: Final
  detail: ProjectedStudentView['detail']
  categories: ProjectedStudentView['categories']
}>) {
  const detailId = useId()
  // Rien à afficher (ex. note convertie non calculable) : pas de section vide.
  if (final.final === undefined && final.raw === undefined) {
    return <p className="text-4xl font-semibold">{ui.text('present_finished', {})}</p>
  }
  if (detail === undefined) {
    return (
      <section
        aria-label={ui.text('final_final', {})}
        className="flex flex-1 flex-col items-center justify-center"
      >
        <Grade ui={ui} final={final} />
      </section>
    )
  }
  return (
    <div className="grid flex-1 grid-cols-1 items-center gap-16 @min-[40rem]:grid-cols-[auto_minmax(0,1fr)]">
      <section aria-label={ui.text('final_final', {})} className="flex justify-center">
        <Grade ui={ui} final={final} />
      </section>
      <section aria-labelledby={detailId} className="flex min-w-0 flex-col gap-4">
        <h2 id={detailId} className="text-2xl font-semibold text-muted-foreground">
          {ui.text('present_detail_heading', {})}
        </h2>
        <ul className="flex flex-col divide-y text-2xl">
          {detail.map((row) => {
            const category = categories.find((c) => c.id === row.categoryId)
            return (
              <li key={row.questionId} className="flex items-center gap-4 py-3">
                <CategoryBadge color={category?.color} icon={category?.icon} size="projection-sm" />
                <span className="min-w-0 flex-1 wrap-anywhere">
                  <span className="text-muted-foreground">{row.categoryLabel}</span>
                  <span aria-hidden className="text-muted-foreground">
                    {' · '}
                  </span>
                  {row.title}
                </span>
                <span className="shrink-0 font-semibold tabular-nums">{rowScore(row, ui)}</span>
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}
