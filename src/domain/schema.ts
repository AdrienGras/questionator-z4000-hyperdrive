import { z } from 'zod'
import { nonEmptyString } from '../config/schema'

/**
 * Forme d'une `Session` (§7, D43), en `strictObject` comme la config (D05). La config figée est
 * validée à part par F02 (`validateConfig`) ; la cohérence interne (score / outcome, références)
 * relève des règles croisées du backup (D48).
 */
const isoDate = () => z.iso.datetime()

const AttemptSchema = z.strictObject({
  id: nonEmptyString(),
  categoryId: nonEmptyString(),
  questionId: nonEmptyString(),
  drawnAt: isoDate(),
  outcome: z.enum(['pending', 'scored', 'skipped']),
  score: z.number().optional(),
  skipReason: z.string().optional(),
  editedAt: isoDate().optional(),
})

const StudentSchema = z.strictObject({
  id: nonEmptyString(),
  lastName: nonEmptyString(),
  firstName: nonEmptyString(),
  order: z.int(),
  addedDuringSession: z.boolean(),
  absent: z.boolean(),
  attempts: z.array(AttemptSchema),
  adjustment: z.strictObject({ value: z.number(), reason: z.string().optional() }).optional(),
  comment: z.string().optional(),
  finalRevealedAt: isoDate().optional(),
})

export const SessionSchema = z.strictObject({
  id: nonEmptyString(),
  name: nonEmptyString(),
  createdAt: isoDate(),
  updatedAt: isoDate(),
  examiner: z.string().optional(),
  appVersion: nonEmptyString(),
  config: z.unknown(),
  students: z.array(StudentSchema),
  activeStudentId: z.string().optional(),
  projection: z.strictObject({
    mode: z.enum(['waiting', 'student']),
    studentId: z.string().optional(),
  }),
})

export type ParsedSession = z.infer<typeof SessionSchema>
