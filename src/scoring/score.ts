import type { NormalizedConfig } from '../config/normalize'
import type { Attempt, Student } from '../domain/types'
import { fraction } from './fraction'
import { asMilli, toMilli, type Milli } from './milli'
import { roundToStep, stepMilli } from './rounding'
import { studentStatus } from './status'

export type ScoreBreakdown = {
  raw: Milli
  capped: Milli
  /** `null` tant que le statut n'est pas `done` (D21). */
  converted: Milli | null
  /** 0 si absent ou sans ajustement. */
  adjustment: Milli
  /** `null` tant que le statut n'est pas `done` (D21). */
  final: Milli | null
}

const ZERO = asMilli(0)

function scoreOf(attempt: Attempt): Milli {
  if (attempt.score === undefined) {
    throw new Error(`Attempt « ${attempt.id} » noté sans score : donnée corrompue`)
  }
  return toMilli(attempt.score)
}

function rawScore(student: Student): Milli {
  return student.attempts
    .filter((attempt) => attempt.outcome === 'scored')
    .reduce((sum, attempt) => asMilli(sum + scoreOf(attempt)), ZERO)
}

function clamp(value: Milli, max: Milli): Milli {
  return asMilli(Math.min(Math.max(value, 0), max))
}

/** Notes d'un étudiant selon §5 : arrondir puis borner (D20), aucune note finale partielle (D21). */
export function computeScores(student: Student, config: NormalizedConfig): ScoreBreakdown {
  const { maxRawScore, finalScale, rounding } = config.scoring
  const maxRaw = toMilli(maxRawScore)
  const scale = toMilli(finalScale)
  const raw = rawScore(student)
  const capped = asMilli(Math.min(raw, maxRaw))
  const adjustment = student.absent ? ZERO : toMilli(student.adjustment?.value ?? 0)
  if (studentStatus(student, config) !== 'done') {
    return { raw, capped, converted: null, adjustment, final: null }
  }
  const step = stepMilli(config)
  const converted = clamp(roundToStep(fraction(capped * scale, maxRaw), step, rounding.mode), scale)
  const final = clamp(roundToStep(fraction(converted + adjustment, 1), step, rounding.mode), scale)
  return { raw, capped, converted, adjustment, final }
}
