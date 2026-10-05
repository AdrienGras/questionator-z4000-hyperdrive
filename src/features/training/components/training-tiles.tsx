import { useId } from 'react'
import { CategoryLayout } from '@/components/category-layout'
import { CategoryTile, categoryTileButtonProps } from '@/components/category-tile'
import { Button } from '@/components/ui/button'
import type { NormalizedConfig } from '@/domain/config/normalize'
import type { Ui } from '@/lib/i18n/use-ui'
import { useFocusOnMount } from '@/features/training/hooks/use-focus-on-mount'

type TrainingTilesProps = Readonly<{
  ui: Ui
  config: NormalizedConfig
  disabled: boolean
  /** Focalise le titre au montage : retour aux tuiles après une note ou un passage. */
  focusOnMount: boolean
  onDraw: (categoryId: string) => void
}>

/**
 * Tuiles de tirage d'un entraînement : une par catégorie, jamais grisées (le cycle recommence
 * quand toutes les questions ont été vues). Seule l'écriture en cours les désactive.
 */
export function TrainingTiles({ ui, config, disabled, focusOnMount, onDraw }: TrainingTilesProps) {
  const { text } = ui
  const titleId = useId()
  const titleRef = useFocusOnMount<HTMLHeadingElement>(focusOnMount)
  return (
    <section className="flex flex-col gap-3">
      <h2 id={titleId} ref={titleRef} tabIndex={-1} className="text-lg font-semibold outline-none">
        {text('training_tiles_title', {})}
      </h2>
      <CategoryLayout
        aria-labelledby={titleId}
        className="gap-3"
        items={config.categories}
        itemKey={(category) => category.id}
        renderItem={(category) => (
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            onClick={() => onDraw(category.id)}
            {...categoryTileButtonProps(category)}
          >
            <CategoryTile ui={ui} config={config} category={category} />
          </Button>
        )}
      />
    </section>
  )
}
