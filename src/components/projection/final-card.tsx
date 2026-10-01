import type { ProjectedStudentView } from '@/domain/presentation/projected-view'
import type { Ui } from '@/lib/i18n/use-ui'

/** Note(s) sur l'échelle et, si demandé, détail question par question. */
export function FinalCard({
  ui,
  final,
  detail,
}: Readonly<{
  ui: Ui
  final: NonNullable<ProjectedStudentView['final']>
  detail: ProjectedStudentView['detail']
}>) {
  const format = new Intl.NumberFormat(ui.locale, { maximumFractionDigits: 2 })
  // Rien à afficher (ex. note convertie non calculable) : pas de section vide.
  if (final.final === undefined && final.raw === undefined) {
    return <p className="text-4xl font-semibold">{ui.text('present_finished', {})}</p>
  }
  return (
    <section className="flex flex-col items-center gap-6">
      {final.final !== undefined && (
        <p className="text-6xl font-bold">
          {ui.text('present_final', {
            value: format.format(final.final),
            scale: format.format(final.scale),
          })}
        </p>
      )}
      {final.raw !== undefined && (
        <p className="text-3xl text-muted-foreground">
          {ui.text('present_raw', { value: format.format(final.raw) })}
        </p>
      )}
      {detail !== undefined && (
        <ul className="w-full max-w-2xl divide-y text-2xl">
          {detail.map((row) => (
            <li key={row.questionId} className="flex items-baseline justify-between gap-4 py-2">
              <span>
                <span className="text-muted-foreground">{row.categoryLabel}</span>
                <span aria-hidden className="text-muted-foreground">
                  {' · '}
                </span>
                {row.title}
              </span>
              <span className="font-semibold">
                {row.skipped
                  ? ui.text('present_skipped', {})
                  : // Notée sans note (donnée incohérente) : « — », jamais une note inventée.
                    `${row.points === undefined ? '—' : format.format(row.points)} / ${format.format(row.maxPoints)}`}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
