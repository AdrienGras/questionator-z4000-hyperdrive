import type { NormalizedCategory, NormalizedConfig } from '@/domain/config/normalize'
import { currentPending, isCategoryExhausted, questionIndex } from '@/domain/passage/selectors'
import { fromMilli } from '@/domain/scoring/milli'
import { computeScores, type ScoreBreakdown } from '@/domain/scoring/score'
import { studentStatus } from '@/domain/scoring/status'
import type { Session, Student } from '@/domain/session/types'

export type ProjectedAppearance = {
  locale: NormalizedConfig['locale']
  theme: NormalizedConfig['theme']
  presentation: { defaultColorMode: NormalizedConfig['presentation']['defaultColorMode'] }
}

/**
 * Seule donnée que la fenêtre projetée reçoit jamais (D30, D69) : construite champ par champ, sans
 * `...spread`, pour qu'un nouveau champ de la config ou de l'étudiant ne fuite pas par défaut.
 * Nombres en points décimaux, pas en `Milli`.
 */
export type ProjectedView =
  | { mode: 'waiting'; examTitle: string; appearance: ProjectedAppearance }
  | {
      mode: 'student'
      examTitle: string
      appearance: ProjectedAppearance
      /** `order` : clé de montage de l'écran (deux homonymes restent distincts), sans l'`id` (D69). */
      student: { firstName: string; lastName: string; order: number }
      categories: {
        id: string
        label: string
        maxPoints: number
        color?: string
        icon?: string
        exhausted: boolean
        disabled: boolean
      }[]
      current?: { categoryId: string; prompt: string; drawnAt: string }
      questionIndex: { current: number; total: number }
      cumulativeRaw?: number
      final?: { raw?: number; final?: number; scale: number }
      finished: boolean
      drawAnimation: boolean
      detail?: {
        /** Clé de ligne : une question n'est tirée qu'une fois par étudiant. */
        questionId: string
        categoryLabel: string
        title: string
        points?: number
        maxPoints: number
        skipped: boolean
      }[]
    }

export type ProjectedStudentView = Extract<ProjectedView, { mode: 'student' }>

function appearanceOf(config: NormalizedConfig): ProjectedAppearance {
  return {
    locale: config.locale,
    theme: {
      light: { ...config.theme.light },
      dark: { ...config.theme.dark },
    },
    presentation: { defaultColorMode: config.presentation.defaultColorMode },
  }
}

function maxPointsOf(category: NormalizedCategory): number {
  return Math.max(...category.scale)
}

function finalOf(scores: ScoreBreakdown, config: NormalizedConfig): ProjectedStudentView['final'] {
  const { finalScoreDisplay } = config.presentation
  const final = scores.final
  return {
    ...(finalScoreDisplay !== 'converted' && { raw: fromMilli(scores.raw) }),
    ...(finalScoreDisplay !== 'raw' && final !== null && { final: fromMilli(final) }),
    scale: config.scoring.finalScale,
  }
}

function detailOf(student: Student, config: NormalizedConfig): ProjectedStudentView['detail'] {
  const detail: NonNullable<ProjectedStudentView['detail']> = []
  for (const attempt of student.attempts) {
    if (attempt.outcome === 'pending') continue
    const category = config.categories.find((c) => c.id === attempt.categoryId)
    if (category === undefined) continue
    const question = category.questions.find((q) => q.id === attempt.questionId)
    const skipped = attempt.outcome === 'skipped'
    detail.push({
      questionId: attempt.questionId,
      categoryLabel: category.label,
      title: question?.title ?? attempt.questionId,
      ...(!skipped && attempt.score !== undefined && { points: attempt.score }),
      maxPoints: maxPointsOf(category),
      skipped,
    })
  }
  return detail
}

/** Vue projetée de la session (F14) ; `waiting` si rien de projetable (id inconnu, étudiant absent). */
export function toProjectedView(session: Session): ProjectedView {
  const { config, projection } = session
  const examTitle = config.exam.title
  const appearance = appearanceOf(config)
  const student =
    projection.mode === 'student'
      ? session.students.find((s) => s.id === projection.studentId)
      : undefined
  if (student === undefined || student.absent) return { mode: 'waiting', examTitle, appearance }

  const pending = currentPending(student)
  const finished = studentStatus(student, config) === 'done'
  // Une seule fois : score cumulé en cours de passage, note finale une fois révélée.
  const scores = computeScores(student, config)
  const question =
    pending === undefined
      ? undefined
      : config.categories
          .find((c) => c.id === pending.categoryId)
          ?.questions.find((q) => q.id === pending.questionId)
  const { presentation } = config
  const revealed = finished && student.finalRevealedAt !== undefined

  return {
    mode: 'student',
    examTitle,
    appearance,
    student: { firstName: student.firstName, lastName: student.lastName, order: student.order },
    categories: config.categories.map((category) => ({
      id: category.id,
      label: category.label,
      maxPoints: maxPointsOf(category),
      ...(category.color !== undefined && { color: category.color }),
      ...(category.icon !== undefined && { icon: category.icon }),
      exhausted: isCategoryExhausted(student, category),
      disabled: pending !== undefined || finished,
    })),
    ...(pending !== undefined &&
      question !== undefined && {
        current: {
          categoryId: pending.categoryId,
          prompt: question.prompt,
          drawnAt: pending.drawnAt,
        },
      }),
    questionIndex: questionIndex(student, config),
    ...(presentation.showCumulativeScore &&
      !finished && {
        cumulativeRaw: fromMilli(scores.raw),
      }),
    ...(revealed && { final: finalOf(scores, config) }),
    finished,
    drawAnimation: presentation.drawAnimation,
    ...(presentation.showStatsOnFinal && revealed && { detail: detailOf(student, config) }),
  }
}
