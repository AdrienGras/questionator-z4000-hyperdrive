import { ProjectedScreen } from '@/components/projection/projected-screen'
import type { ProjectedView } from '@/domain/presentation/projected-view'
import { useElementWidth } from '@/hooks/use-element-width'
import { cn } from '@/lib/utils'

const CANVAS_WIDTH = 1280

type ProjectionCanvasProps = Readonly<{ view: ProjectedView; className?: string }>

/**
 * Vue projetée sur un canevas de 1280×720 réduit par `transform: scale` à la largeur mesurée
 * de sa boîte. Sans animation de tirage, hors de l'arbre d'accessibilité et du clavier.
 */
export function ProjectionCanvas({ view, className }: ProjectionCanvasProps) {
  const [ref, width] = useElementWidth<HTMLDivElement>()
  return (
    <div
      ref={ref}
      className={cn('relative aspect-video w-full overflow-hidden rounded-md border', className)}
    >
      {/* Classes littérales (Tailwind) : 1280 = CANVAS_WIDTH, 720 = 1280 × 9/16. */}
      <div
        data-projection-canvas
        aria-hidden="true"
        inert
        className="absolute top-0 left-0 h-[720px] w-[1280px] origin-top-left bg-background text-foreground"
        style={{
          transform: `scale(${width / CANVAS_WIDTH})`,
          visibility: width === 0 ? 'hidden' : undefined,
        }}
      >
        <ProjectedScreen view={view} animate={false} className="h-full" />
      </div>
    </div>
  )
}
