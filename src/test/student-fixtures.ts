import { normalize, type NormalizedConfig } from '../config/normalize'
import type { ParsedConfig } from '../config/schema'
import { minimalConfig } from './config-fixtures'

/** Config normalisée de test : `minimalConfig` avec `scoring` et `absent` surchargés. */
export function makeConfig(
  scoring: Partial<ParsedConfig['scoring']> = {},
  absent?: ParsedConfig['absent'],
): NormalizedConfig {
  const config = minimalConfig()
  config.scoring = { ...config.scoring, ...scoring }
  if (absent !== undefined) config.absent = absent
  return normalize(config)
}
