import { toProjectedView, type ProjectedView } from '@/domain/presentation/projected-view'
import { useSession } from '@/lib/db/hooks'

/**
 * Étanchéité de la vue projetée (F14, D69) : la `Session` s'arrête ici, la route ne voit que la
 * `ProjectedView`. `undefined` : chargement ; `null` : session introuvable.
 */
export function useProjectedView(sessionId: string): ProjectedView | null | undefined {
  const session = useSession(sessionId)
  if (session === undefined || session === null) return session
  return toProjectedView(session)
}
