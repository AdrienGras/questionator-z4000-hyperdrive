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

/** Un bouton par valeur du barème d'une catégorie, note brute formatée selon la config. */
export function ScaleButtons({ ui, config, scale, disabled, onScore }: ScaleButtonsProps) {
  const { text, locale } = ui
  return (
    <div className="flex flex-wrap gap-2">
      {scale.map((value) => {
        const formatted = formatScore(toMilli(value), 'raw', config, locale)
        return (
          <Button
            key={value}
            type="button"
            variant="outline"
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
