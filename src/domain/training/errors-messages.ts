import { t, type Dictionary, type Locale } from '@/lib/i18n/i18n'
import type { TrainingError, TrainingErrorCode } from './errors'

type NoParams = Record<string, never>
type TrainingErrorParams = Record<TrainingErrorCode, NoParams>

const fr: Dictionary<TrainingErrorParams> = {
  category_not_found: () => 'Cette catégorie n’existe pas dans la config.',
  pending_exists: () => 'Une question est déjà en cours : notez-la d’abord.',
  not_pending: () => 'Cette question n’est plus en cours.',
  score_not_in_scale: () => 'Cette note ne fait pas partie du barème.',
}

const en: Dictionary<TrainingErrorParams> = {
  category_not_found: () => 'This category is not in the config.',
  pending_exists: () => 'A question is already in progress: score it first.',
  not_pending: () => 'This question is no longer in progress.',
  score_not_in_scale: () => 'This score is not part of the scale.',
}

export const TRAINING_ERROR_MESSAGES: Record<Locale, Dictionary<TrainingErrorParams>> = { fr, en }

export function trainingErrorMessage(error: TrainingError, locale: Locale): string {
  return t(TRAINING_ERROR_MESSAGES, locale, error.code, {})
}
