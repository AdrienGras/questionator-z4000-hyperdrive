import type { NormalizedConfig } from '@/domain/config/normalize'
import { useSession } from '@/lib/db/hooks'

/**
 * Étanchéité de la vue projetée (F14) : ne sort que la config, jamais la `Session`. F14 remplace
 * ce hook par `toProjectedView`.
 */
export function usePresentedConfig(sessionId: string): NormalizedConfig | null | undefined {
  const session = useSession(sessionId)
  if (session === undefined || session === null) return session
  return session.config
}
