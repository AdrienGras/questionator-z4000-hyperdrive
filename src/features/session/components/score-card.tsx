import { ActionHalo } from '@/components/action-halo'
import { ScaleButtons } from '@/components/scale-buttons'
import type { NormalizedConfig } from '@/domain/config/normalize'
import { formatRawScore } from '@/domain/scoring/format'
import { toMilli } from '@/domain/scoring/milli'
import type { Attempt } from '@/domain/session/types'
import type { Ui } from '@/lib/i18n/use-ui'
import { SkipButton } from './skip-button'

type ScoreCardProps = Readonly<{
  ui: Ui
  config: NormalizedConfig
  /** Question en cours (`pending`). */
  attempt: Attempt
  disabled: boolean
  skipsRemaining: number
  onScore: (attemptId: string, value: number) => void
  onSkip: (attemptId: string, reason: string | undefined) => void
}>

/**
 * Carte « Note » de la colonne de droite (artboard `passage-question`), action principale de
 * l'écran sous son halo : un bouton par valeur du barème, qui note et ferme la question en un clic
 * (D103, aucun état « sélectionné »), puis « Passer la question » et le nombre de passes restantes.
 */
export function ScoreCard({
  ui,
  config,
  attempt,
  disabled,
  skipsRemaining,
  onScore,
  onSkip,
}: ScoreCardProps) {
  const { text, locale } = ui
  const category = config.categories.find((c) => c.id === attempt.categoryId)
  if (category === undefined) {
    throw new Error(
      `Attempt « ${attempt.id} » désigne une catégorie introuvable : donnée corrompue`,
    )
  }
  const max = formatRawScore(toMilli(Math.max(...category.scale)), locale)
  return (
    <ActionHalo side="around">
      <section
        aria-label={text('passage_score_card', {})}
        className="flex flex-col gap-4 rounded-lg bg-card p-6 shadow-card"
      >
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-h2">{text('passage_score_heading', {})}</h2>
          <span className="text-small text-muted-foreground">
            {text('passage_score_context', { category: category.label, max })}
          </span>
        </div>
        <ScaleButtons
          ui={ui}
          config={config}
          scale={category.scale}
          disabled={disabled}
          onScore={(value) => onScore(attempt.id, value)}
        />
        {config.skips.enabled && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3">
            <SkipButton
              ui={ui}
              skips={config.skips}
              remaining={skipsRemaining}
              disabled={disabled}
              onSkip={(reason) => onSkip(attempt.id, reason)}
            />
            <span className="text-small text-muted-foreground tabular-nums">
              {text('passage_skips_remaining', { remaining: skipsRemaining })}
            </span>
          </div>
        )}
      </section>
    </ActionHalo>
  )
}
