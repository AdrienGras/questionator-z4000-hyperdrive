import type { CSSProperties } from 'react'
import { CategoryIcon } from '@/components/category-icon'
import { CategoryLayout } from '@/components/category-layout'
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
 * Grille de tirage (spec F09 §7) : un bouton pleine hauteur par catégorie, dans l'ordre de la
 * config, accent couleur en bordure/icône seulement (D26). Disposition selon le nombre de
 * catégories, commune avec la vue projetée (`CategoryLayout`, D74).
 *
 * Catégorie épuisée pour l'étudiant actif : le bouton lui-même porte l'infobulle
 * (`TooltipTrigger render={<Button …/>}`, comme `src/features/home/components/home-header.tsx`)
 * et reste `aria-disabled`, jamais `disabled` — un bouton HTML nativement désactivé n'émet ni
 * `focus` ni `mouseenter`, l'infobulle ne s'ouvrirait jamais (D06). Le clic est alors un no-op ;
 * le motif est en plus exposé via `aria-describedby` vers un texte visually-hidden, indépendant
 * de l'ouverture de l'infobulle. Le verrou de grille entière (question en cours / écriture en
 * base) reste un vrai `disabled` : dans cet état, aucune catégorie n'est actionnable.
 */
export function CategoryGrid({ ui, config, student, disabled, onDraw }: CategoryGridProps) {
  const { text, locale } = ui
  return (
    <CategoryLayout
      aria-label={text('passage_categories', {})}
      className="gap-3"
      items={config.categories}
      itemKey={(category) => category.id}
      renderItem={(category) => {
        const exhausted = isCategoryExhausted(student, category)
        const { color } = category
        const accent: (CSSProperties & Record<'--category-color', string>) | undefined =
          color === undefined ? undefined : { '--category-color': color }
        const max = formatScore(toMilli(Math.max(...category.scale)), 'raw', config, locale)
        const reasonId = `passage-category-exhausted-${category.id}`

        const content = (
          <>
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
          </>
        )

        const handleClick = () => {
          if (exhausted) return
          onDraw(category.id)
        }

        // `dark:` répété : sinon `dark:border-input` du variant outline l'emporte en sombre.
        // Pas de `pointer-events-none` sur `aria-disabled` : le survol doit ouvrir l'infobulle,
        // le clic est déjà neutralisé par `handleClick` (QUIRKS).
        const buttonClassName =
          'flex h-full w-full flex-col items-center gap-2 p-4 text-center whitespace-normal ' +
          'data-[colored=true]:border-[var(--category-color)] ' +
          'dark:data-[colored=true]:border-[var(--category-color)] ' +
          'aria-disabled:cursor-not-allowed aria-disabled:opacity-50'

        return (
          <>
            {exhausted ? (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      type="button"
                      variant="outline"
                      disabled={disabled}
                      aria-disabled="true"
                      aria-describedby={reasonId}
                      onClick={handleClick}
                      style={accent}
                      data-colored={color !== undefined}
                      className={buttonClassName}
                    />
                  }
                >
                  {content}
                </TooltipTrigger>
                <TooltipContent>{text('passage_category_exhausted', {})}</TooltipContent>
              </Tooltip>
            ) : (
              <Button
                type="button"
                variant="outline"
                disabled={disabled}
                onClick={handleClick}
                style={accent}
                data-colored={color !== undefined}
                className={buttonClassName}
              >
                {content}
              </Button>
            )}
            {exhausted && (
              <span id={reasonId} className="sr-only">
                {text('passage_category_exhausted', {})}
              </span>
            )}
          </>
        )
      }}
    />
  )
}
