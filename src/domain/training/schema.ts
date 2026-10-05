import { z } from 'zod'
import { nonEmptyString } from '@/domain/config/schema'

/**
 * Forme d'un `Training` et d'une ligne du journal (`TrainingDraw`), en `strictObject` comme les
 * sessions. La config est validée à part par F02 (`validateConfig`).
 */
const isoDate = () => z.iso.datetime()

export const TrainingSchema = z.strictObject({
  id: nonEmptyString(),
  name: nonEmptyString(),
  createdAt: isoDate(),
  updatedAt: isoDate(),
  config: z.unknown(),
})

const OutcomeSchema = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('pending') }),
  z.strictObject({
    kind: z.literal('scored'),
    points: z.number().finite(),
    max: z.number().finite(),
  }),
  z.strictObject({ kind: z.literal('passed') }),
])

export const TrainingDrawSchema = z.strictObject({
  id: z.int().optional(),
  trainingId: nonEmptyString(),
  questionId: nonEmptyString(),
  drawnAt: z.string(),
  outcome: OutcomeSchema,
})
