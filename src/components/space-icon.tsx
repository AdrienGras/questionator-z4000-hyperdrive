import { IconFileCode, IconPresentationAnalytics, IconSchool, type Icon } from '@tabler/icons-react'
import { cn } from '@/lib/utils'

export type Space = 'sessions' | 'training' | 'editor'

/** Icône et teinte de chaque espace, les mêmes tracés que le menu. Classes écrites en entier pour Tailwind. */
const SPACES: Record<Space, { icon: Icon; tone: string }> = {
  sessions: { icon: IconPresentationAnalytics, tone: 'bg-space-sessions/14 text-space-sessions' },
  training: { icon: IconSchool, tone: 'bg-space-training/14 text-space-training' },
  editor: { icon: IconFileCode, tone: 'bg-space-editor/14 text-space-editor' },
}

const SIZES = {
  sm: { tile: 'size-8 rounded-[10px]', icon: 'size-4.5' },
  md: { tile: 'size-10 rounded-md', icon: 'size-5.5' },
  lg: { tile: 'size-13 rounded-[14px]', icon: 'size-6.5' },
} as const

type SpaceIconProps = Readonly<{ space: Space; size: keyof typeof SIZES }>

/**
 * Tuile d'icône teintée d'un espace (artboards `accueil`, `sessions`, `trainings`) : cartes de
 * l'accueil, tuiles d'espace, en-tête des pages d'espace. Le menu garde sa tuile neutre (D103).
 */
export function SpaceIcon({ space, size }: SpaceIconProps) {
  const { icon: SpaceGlyph, tone } = SPACES[space]
  return (
    <span
      aria-hidden="true"
      className={cn('inline-flex shrink-0 items-center justify-center', SIZES[size].tile, tone)}
    >
      <SpaceGlyph className={SIZES[size].icon} />
    </span>
  )
}
