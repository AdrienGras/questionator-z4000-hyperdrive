import { useMemo } from 'react'
import { toProjectedView, type ProjectedView } from '@/domain/presentation/projected-view'
import { useSession } from '@/lib/db/hooks'

/**
 * Étanchéité de la vue projetée (F14, D69) : la `Session` s'arrête ici, la route ne voit que la
 * `ProjectedView`. `undefined` : chargement ; `null` : session introuvable. Mémoïsée sur la
 * session : un rendu sans changement de session ne reconstruit pas la vue.
 */
export function useProjectedView(sessionId: string): ProjectedView | null | undefined {
  const session = useSession(sessionId)
  return useMemo(
    () => (session === undefined || session === null ? session : toProjectedView(session)),
    [session],
  )
}
