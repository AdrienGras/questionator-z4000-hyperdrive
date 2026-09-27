import type { CSSProperties } from 'react'
import { CategoryIcon } from '@/components/category-icon'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { NormalizedConfig } from '@/domain/config/normalize'
import { isCategoryExhausted } from '@/domain/passage/selectors'
import { formatScore } from '@/domain/scoring/format'
import { toMilli } from '@/domain/scoring/milli'
import type { Student } from '@/domain/session/types'
import type { Ui } from '@/lib/i18n/use-ui'

type CategoryGridProps = Readonly<{
  ui: Ui
  config: NormalizedConfig
  student: Student
  disabled: boolean
  onDraw: (categoryId: string) => void
}>

/**
 * Grille de tirage (§7) : un bouton pleine hauteur par catégorie, dans l'ordre de la config,
 * accent couleur en bordure/icône seulement (D26). Catégorie épuisée pour l'étudiant actif :
 * bouton désactivé, enveloppé d'un `<span tabIndex={0}>` qui porte l'infobulle, car un bouton
 * désactivé n'émet pas d'événement de survol ni de focus (D06).
 */
export function CategoryGrid({ ui, config, student, disabled, onDraw }: CategoryGridProps) {
  const { text, locale } = ui
  return (
    <ul
      aria-label={text('passage_categories', {})}
      className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
    >
      {config.categories.map((category) => {
        const exhausted = isCategoryExhausted(student, category)
        const { color } = category
        const accent: (CSSProperties & Record<'--category-color', string>) | undefined =
          color === undefined ? undefined : { '--category-color': color }
        const max = formatScore(toMilli(Math.max(...category.scale)), 'raw', config, locale)
        const button = (
          <Button
            type="button"
            variant="outline"
            disabled={disabled || exhausted}
            onClick={() => onDraw(category.id)}
            style={accent}
            data-colored={color !== undefined}
            className="flex h-full w-full flex-col items-center gap-2 p-4 text-center whitespace-normal data-[colored=true]:border-[var(--category-color)]"
          >
            {category.icon !== undefined && (
              <CategoryIcon
                name={category.icon}
                className="size-6 shrink-0 text-[var(--category-color,currentColor)]"
              />
            )}
            <span>{category.label}</span>
            <span className="text-xs text-muted-foreground">
              {text('passage_category_max', { max })}
            </span>
          </Button>
        )
        return (
          <li key={category.id}>
            {exhausted ? (
              <Tooltip>
                {/* oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- span rendu focalisable exprès : porte l'infobulle quand le bouton qu'il enveloppe est désactivé, car un bouton désactivé n'émet aucun événement de survol ni de focus (D06). */}
                <TooltipTrigger render={<span tabIndex={0} className="block h-full" />}>
                  {button}
                </TooltipTrigger>
                <TooltipContent>{text('passage_category_exhausted', {})}</TooltipContent>
              </Tooltip>
            ) : (
              button
            )}
          </li>
        )
      })}
    </ul>
  )
}
