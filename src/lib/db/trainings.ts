import { Dexie } from 'dexie'
import type { NormalizedConfig } from '@/domain/config/normalize'
import { pickTrainingQuestion } from '@/domain/training/cycle-draw'
import { TrainingError } from '@/domain/training/errors'
import { replaceTrainingConfig } from '@/domain/training/replace-config'
import { passedOutcome, scoredOutcome } from '@/domain/training/resolve-draw'
import type { DrawOutcome, Training, TrainingDraw } from '@/domain/training/types'
import { db } from './db'
import { isDamagedTraining, loadReadStoredTraining, type StoredTraining } from './damaged-training'
import { TrainingDamagedError, TrainingExistsError, TrainingNotFoundError } from './errors'
import { compareRecords } from './record-order'

type Clock = { now: () => Date }

/** Crée un entraînement construit par `newTraining` ; `TrainingExistsError` si l'`id` existe déjà. */
export async function createTraining(training: Training): Promise<void> {
  try {
    await db.trainings.add(training)
  } catch (error) {
    if (error instanceof Dexie.ConstraintError) throw new TrainingExistsError(training.id)
    throw error
  }
}

/** Entraînement validé, forme endommagée si l'enregistrement est incohérent, `null` si absent. */
export async function getTraining(id: string): Promise<StoredTraining | null> {
  // Lecture Dexie d'abord, validateur ensuite : `useLiveQuery` observe les lectures faites avant
  // le premier `await` d'une promesse non Dexie (F31).
  const raw = await db.trainings.get(id)
  if (raw === undefined) return null
  const readStored = await loadReadStoredTraining()
  return readStored.training(raw, id)
}

/** Entraînements du plus récemment modifié au plus ancien, chacun validé (même ordre que les sessions). */
export async function listTrainings(): Promise<StoredTraining[]> {
  const records = await db.trainings.toArray()
  if (records.length === 0) return []
  const sorted = records.toSorted(compareRecords)
  const readStored = await loadReadStoredTraining()
  return sorted.map((record) => readStored.training(record, record.id))
}

/** Lignes brutes du journal d'un entraînement, dans l'ordre d'insertion (id auto-incrémenté). */
function drawRowsOf(trainingId: string): Promise<TrainingDraw[]> {
  return db.trainingDraws.where('trainingId').equals(trainingId).toArray()
}

/** Journal validé d'un entraînement, dans l'ordre d'insertion ; les lignes invalides sont écartées. */
export async function getTrainingDraws(trainingId: string): Promise<TrainingDraw[]> {
  const rows = await drawRowsOf(trainingId)
  const readStored = await loadReadStoredTraining()
  return readStored.draws(rows)
}

/**
 * Lecture fraîche puis écriture dans une seule transaction `rw` sur les deux tables : deux onglets
 * ne posent jamais deux tirages en cours. Absent → `TrainingNotFoundError` ; endommagé →
 * `TrainingDamagedError`, avant tout appel au domaine. Si `write` lève, rien n'est écrit.
 */
async function writeTraining<T>(
  id: string,
  write: (training: Training, draws: TrainingDraw[]) => Promise<T>,
): Promise<T> {
  // Chargé avant la transaction : un `import()` attendu dedans la ferait valider trop tôt
  // (`PrematureCommitError`). La validation, elle, reste synchrone dans la transaction.
  const readStored = await loadReadStoredTraining()
  return db.transaction('rw', db.trainings, db.trainingDraws, async () => {
    const raw = await db.trainings.get(id)
    if (raw === undefined) throw new TrainingNotFoundError(id)
    const training = readStored.training(raw, id)
    if (isDamagedTraining(training)) throw new TrainingDamagedError(id)
    const draws = readStored.draws(await drawRowsOf(id))
    return write(training, draws)
  })
}

async function touch(id: string, updatedAt: string): Promise<void> {
  await db.trainings.update(id, { updatedAt })
}

/** Tire une question de la catégorie, l'inscrit `pending` au journal et la renvoie avec son id. */
export function drawTrainingQuestion(
  trainingId: string,
  categoryId: string,
  deps: Clock & { random: (n: number) => number },
): Promise<TrainingDraw> {
  return writeTraining(trainingId, async (training, draws) => {
    const questionId = pickTrainingQuestion(training.config, draws, categoryId, deps.random)
    const drawnAt = deps.now().toISOString()
    const draw: TrainingDraw = { trainingId, questionId, drawnAt, outcome: { kind: 'pending' } }
    const id = await db.trainingDraws.add(draw)
    await touch(trainingId, drawnAt)
    return { ...draw, id }
  })
}

/** Résout un tirage en cours de cet entraînement ; un tirage inconnu ou d'un autre est `not_pending`. */
function resolveDraw(
  trainingId: string,
  drawId: number,
  deps: Clock,
  resolve: (training: Training, draw: TrainingDraw) => DrawOutcome,
): Promise<void> {
  return writeTraining(trainingId, async (training, draws) => {
    const draw = draws.find((d) => d.id === drawId)
    if (draw === undefined) throw new TrainingError('not_pending')
    await db.trainingDraws.put({ ...draw, outcome: resolve(training, draw) })
    await touch(trainingId, deps.now().toISOString())
  })
}

/** Note un tirage en cours ; `points` est une valeur du barème (D43), `max` est figé à la note. */
export function scoreTrainingDraw(
  trainingId: string,
  drawId: number,
  points: number,
  deps: Clock,
): Promise<void> {
  return resolveDraw(trainingId, drawId, deps, (training, draw) =>
    scoredOutcome(training.config, draw, points),
  )
}

/** Passe un tirage en cours sans le noter. */
export function passTrainingDraw(trainingId: string, drawId: number, deps: Clock): Promise<void> {
  return resolveDraw(trainingId, drawId, deps, (_training, draw) => passedOutcome(draw))
}

/**
 * Remplace la config ; le nom suit le titre de l'examen, le journal est conservé et les tirages
 * `pending` dont la question a disparu passent à `passed`.
 */
export function replaceTrainingConfigInDb(
  trainingId: string,
  config: NormalizedConfig,
  deps: Clock,
): Promise<void> {
  return writeTraining(trainingId, async (training, draws) => {
    const replaced = replaceTrainingConfig(training, config, draws)
    const orphans = new Set(replaced.orphanPendingIds)
    const passed = draws
      .filter((d) => d.id !== undefined && orphans.has(d.id))
      .map((d): TrainingDraw => ({ ...d, outcome: { kind: 'passed' } }))
    await db.trainingDraws.bulkPut(passed)
    await db.trainings.put({ ...replaced.training, updatedAt: deps.now().toISOString() })
  })
}

/** Supprime l'entraînement et tout son journal, dans une seule transaction ; absent, ne lève pas. */
export function deleteTraining(id: string): Promise<void> {
  return db.transaction('rw', db.trainings, db.trainingDraws, async () => {
    await db.trainings.delete(id)
    await db.trainingDraws.where('trainingId').equals(id).delete()
  })
}
