import { useMemo } from 'react'
import { toProjectedView, type ProjectedView } from '@/domain/presentation/projected-view'
import { isDamaged } from '@/lib/db/damaged-session'
import { useSession } from '@/lib/db/hooks'

/**
 * Étanchéité de la vue projetée (F14, D69) : la `Session` s'arrête ici, la route ne voit que la
 * `ProjectedView`. `undefined` : chargement ; `null` : session introuvable ; `'damaged'` : session
 * endommagée (F31), aucune vue n'est construite. Mémoïsée sur la session : un rendu sans
 * changement de session ne reconstruit pas la vue.
 */
export function useProjectedView(sessionId: string): ProjectedView | 'damaged' | null | undefined {
  const session = useSession(sessionId)
  return useMemo(() => {
    if (session === undefined || session === null) return session
    return isDamaged(session) ? 'damaged' : toProjectedView(session)
  }, [session])
}
