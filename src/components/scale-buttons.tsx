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
  /**
   * `grid` (défaut, carte « Note » du passage) : grille qui s'adapte au nombre de valeurs. `row`
   * (question d'entraînement) : rangée qui passe à la ligne, boutons teintés par `--category-color`,
   * posé par un parent.
   */
  variant?: 'grid' | 'row'
  onScore: (value: number) => void
}>

// Teinte de catégorie (D103), classes écrites en entier (Tailwind ne lit que des littéraux) ; type
// `color:` explicite et `dark:` répété, comme `CATEGORY_TILE_BUTTON_CLASS`.
const LAYOUT = {
  grid: {
    container: 'grid grid-cols-[repeat(auto-fit,minmax(3.5rem,1fr))] gap-2',
    button: 'h-16 bg-background px-2 text-[1.375rem] leading-none font-bold tabular-nums',
  },
  row: {
    container: 'flex flex-wrap gap-2',
    button:
      'h-14 min-w-16 px-4 text-lg leading-none font-bold text-foreground tabular-nums hover:text-foreground ' +
      'border-[color:color-mix(in_oklch,var(--category-color,var(--color-muted-foreground))_40%,transparent)] ' +
      'dark:border-[color:color-mix(in_oklch,var(--category-color,var(--color-muted-foreground))_40%,transparent)] ' +
      'bg-[color:color-mix(in_oklch,var(--category-color,var(--color-muted-foreground))_8%,var(--color-card))] ' +
      'hover:bg-[color:color-mix(in_oklch,var(--category-color,var(--color-muted-foreground))_14%,var(--color-card))]',
  },
} as const

/**
 * Un bouton par valeur du barème d'une catégorie, note brute formatée selon la config : en grille
 * (artboard `passage-question`) ou en rangée teintée (artboard `entrainement-question`).
 */
export function ScaleButtons({
  ui,
  config,
  scale,
  disabled,
  variant = 'grid',
  onScore,
}: ScaleButtonsProps) {
  const { text, locale } = ui
  const layout = LAYOUT[variant]
  return (
    <div className={layout.container}>
      {scale.map((value) => {
        const formatted = formatScore(toMilli(value), 'raw', config, locale)
        return (
          <Button
            key={value}
            type="button"
            variant="outline"
            className={layout.button}
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
