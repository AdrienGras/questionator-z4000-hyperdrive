import type { NormalizedConfig } from '@/domain/config/normalize'
import type { Student } from '@/domain/session/types'
import { fromMilli } from './milli'
import { computeScores } from './score'

function absentValue(config: NormalizedConfig): number | string {
  const { label, value } = config.absent
  switch (config.absent.export) {
    case 'label':
      return label
    case 'zero':
      return 0
    case 'value':
      if (value === undefined) {
        throw new Error(
          'absent.value manquant alors que absent.export vaut « value » (écarté par F02)',
        )
      }
      return value
    default: {
      const unreachable: never = config.absent.export
      throw new Error(`Mode absent invalide : ${String(unreachable)}`)
    }
  }
}

/** Valeur de la colonne « note finale » de l'export : texte ou nombre pour un absent, `null` si non terminé. */
export function exportedFinal(student: Student, config: NormalizedConfig): number | string | null {
  if (student.absent) return absentValue(config)
  const { final } = computeScores(student, config)
  return final === null ? null : fromMilli(final)
}
