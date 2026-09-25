import type { NormalizedConfig } from '@/domain/config/normalize'
import { hasAtMostThreeDecimals, toMilli } from './milli'
import { stepMilli } from './rounding'

/**
 * Un ajustement se saisit par multiples du pas d'arrondi (D02), au plus `finalScale` en valeur
 * absolue (D44). Ne lève jamais : les contrôles bornent la valeur avant toute conversion.
 */
export function isValidAdjustment(value: number, config: NormalizedConfig): boolean {
  if (!Number.isFinite(value) || !hasAtMostThreeDecimals(value)) return false
  if (Math.abs(value) > config.scoring.finalScale) return false
  return toMilli(value) % stepMilli(config) === 0
}
