import { IconArrowRight } from '@tabler/icons-react'
import { Link } from '@tanstack/react-router'
import { SpaceIcon, type Space } from '@/components/space-icon'
import type { Ui } from '@/lib/i18n/use-ui'

type Tile = {
  space: Space
  to: '/sessions' | '/trainings' | '/editor'
  name: string
  body: string
  cta: string
  count?: number
}

type SpaceTilesProps = Readonly<{ ui: Ui; sessionCount: number; trainingCount: number }>

/**
 * Tuiles « Espaces » de l'accueil (artboard `accueil`) : une carte-lien par espace, avec le nombre
 * d'enregistrements (endommagés compris) ; l'éditeur n'en a pas.
 */
export function SpaceTiles({ ui, sessionCount, trainingCount }: SpaceTilesProps) {
  const { text } = ui
  const tiles: Tile[] = [
    {
      space: 'sessions',
      to: '/sessions',
      name: text('menu_sessions', {}),
      body: text('home_space_sessions_body', {}),
      cta: text('home_space_view_all', {}),
      count: sessionCount,
    },
    {
      space: 'training',
      to: '/trainings',
      name: text('home_space_trainings', {}),
      body: text('home_space_trainings_body', {}),
      cta: text('home_space_view_all', {}),
      count: trainingCount,
    },
    {
      space: 'editor',
      to: '/editor',
      name: text('menu_editor', {}),
      body: text('home_space_editor_body', {}),
      cta: text('home_editor_open', {}),
    },
  ]
  return (
    <section aria-labelledby="home-spaces-title" className="flex flex-col gap-4">
      <h2 id="home-spaces-title" className="text-h2">
        {text('home_spaces_title', {})}
      </h2>
      <ul className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,220px),1fr))] gap-4">
        {tiles.map((tile) => (
          <li key={tile.to} className="flex">
            <Link
              to={tile.to}
              className="flex min-h-49 w-full flex-col gap-3 rounded-xl bg-card p-5 text-foreground shadow-card hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <span className="flex items-start justify-between gap-3">
                <SpaceIcon space={tile.space} size="md" />
                {tile.count !== undefined && (
                  <span className="text-score-md tabular-nums">{tile.count}</span>
                )}
              </span>
              <span className="flex flex-col gap-0.5">
                <span className="text-h3">{tile.name}</span>
                <span className="text-[13px] leading-[18px] text-muted-foreground">
                  {tile.body}
                </span>
              </span>
              <span className="mt-auto inline-flex items-center gap-1.5 text-[13px] leading-[18px] font-semibold">
                {tile.cta}
                <IconArrowRight aria-hidden className="size-4" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
