import { Button } from '@/components/ui/button'
import type { NormalizedConfig } from '@/domain/config/normalize'
import { formatScore } from '@/domain/scoring/format'
import { toMilli } from '@/domain/scoring/milli'
import type { Ui } from '@/lib/i18n/use-ui'

type ScaleButtonsProps = Readonly<{
  ui: Ui
  config: NormalizedConfig
  scale: readonly number[]
  disabled: boolean
  onScore: (value: number) => void
}>

/**
 * Un bouton par valeur du barème d'une catégorie, note brute formatée selon la config, en grille
 * qui s'adapte au nombre de valeurs (artboard `passage-question`).
 */
export function ScaleButtons({ ui, config, scale, disabled, onScore }: ScaleButtonsProps) {
  const { text, locale } = ui
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(3.5rem,1fr))] gap-2">
      {scale.map((value) => {
        const formatted = formatScore(toMilli(value), 'raw', config, locale)
        return (
          <Button
            key={value}
            type="button"
            variant="outline"
            className="h-16 bg-background px-2 text-[1.375rem] leading-none font-bold tabular-nums"
            disabled={disabled}
            aria-label={text('passage_score_button', { value: formatted })}
            onClick={() => onScore(value)}
          >
            {formatted}
          </Button>
        )
      })}
    </div>
  )
}
