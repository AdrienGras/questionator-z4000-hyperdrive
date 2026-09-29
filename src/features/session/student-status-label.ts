import type { StudentStatus } from '@/domain/scoring/status'
import type { UiMessageParams } from '@/lib/i18n/ui-messages'

type StatusKey = Extract<keyof UiMessageParams, `passage_status_${string}`>

/** Clé i18n du libellé de chaque statut d'étudiant. */
export const STATUS_KEY: Record<StudentStatus, StatusKey> = {
  todo: 'passage_status_todo',
  in_progress: 'passage_status_in_progress',
  done: 'passage_status_done',
  absent: 'passage_status_absent',
}
