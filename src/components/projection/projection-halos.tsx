import { cn } from '@/lib/utils'

const HALO = 'absolute blur-sm'
const ACTION = 'bg-[radial-gradient(closest-side,var(--color-halo-action),transparent)]'
const COOL = 'bg-[radial-gradient(closest-side,var(--color-halo-cool),transparent)]'

/**
 * Positions des deux halos, en proportion de l'écran (artboards `projection-*` de 1280 × 800) :
 * la fenêtre projetée n'a pas la taille de l'artboard.
 */
const PLACEMENTS = {
  waiting: ['top-[15%] left-[23%] h-130 w-175', 'top-[57%] left-[64%] h-120 w-155'],
  student: ['-top-[27%] -left-[12%] h-125 w-190', 'top-[67%] left-[70%] h-110 w-140'],
  final: ['top-[21%] left-[21%] h-140 w-185', '-top-[20%] left-[69%] h-105 w-140'],
} as const

/**
 * Halos flous de la vue projetée (`halo-action`, puis `halo-cool`), dérivés de `--primary` : ils
 * suivent le thème de la session. Décor seul, sous le contenu, coupé au bord de l'écran.
 */
export function ProjectionHalos({ placement }: Readonly<{ placement: keyof typeof PLACEMENTS }>) {
  const [action, cool] = PLACEMENTS[placement]
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div data-halo className={cn(HALO, ACTION, action)} />
      <div data-halo className={cn(HALO, COOL, cool)} />
    </div>
  )
}
