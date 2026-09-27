import { t, type Dictionary, type Locale } from '@/lib/i18n/i18n'
import type { PassageError, PassageErrorCode } from './errors'

type NoParams = Record<string, never>
type PassageErrorParams = Record<PassageErrorCode, NoParams>

const fr: Dictionary<PassageErrorParams> = {
  student_not_found: () => 'Cet étudiant n’existe plus dans la session.',
  category_not_found: () => 'Cette catégorie n’existe pas dans la config.',
  attempt_not_found: () => 'Cette question n’existe plus.',
  student_absent: () => 'L’étudiant est marqué absent.',
  student_done: () => 'Le passage de cet étudiant est terminé.',
  pending_exists: () => 'Une question est déjà en cours : notez-la d’abord.',
  category_exhausted: () => 'Plus de question disponible dans cette catégorie.',
  not_pending: () => 'Cette question est déjà notée.',
  score_not_in_scale: () => 'Cette note ne fait pas partie du barème.',
}

const en: Dictionary<PassageErrorParams> = {
  student_not_found: () => 'This student is no longer in the session.',
  category_not_found: () => 'This category is not in the config.',
  attempt_not_found: () => 'This question no longer exists.',
  student_absent: () => 'The student is marked absent.',
  student_done: () => 'This student’s exam is complete.',
  pending_exists: () => 'A question is already in progress: score it first.',
  category_exhausted: () => 'No questions left in this category.',
  not_pending: () => 'This question has already been scored.',
  score_not_in_scale: () => 'This score is not part of the scale.',
}

export const PASSAGE_ERROR_MESSAGES: Record<Locale, Dictionary<PassageErrorParams>> = { fr, en }

export function passageErrorMessage(error: PassageError, locale: Locale): string {
  return t(PASSAGE_ERROR_MESSAGES, locale, error.code, {})
}
