import { categoryLabel, questionTitle } from '@/domain/config/lookup'
import { fromMilli, type Milli } from '@/domain/scoring/milli'
import type { Session } from '@/domain/session/types'
import { binLabel, compositionLabel, reasonsLabel } from '@/domain/stats/labels'
import type { SessionStats } from '@/domain/stats/types'
import type { Locale } from '@/lib/i18n/i18n'
import { header, num, text } from './cells'
import { DECIMAL_2_FORMAT, RATE_FORMAT, scoreFormat } from './formats'
import { exportText, type ExportMessageKey } from './messages'
import type { Cell, SheetSpec } from './types'

/** Nombre facultatif : `null` → cellule vide. */
const optionalNum = (value: number | null, format?: string): Cell =>
  value === null ? null : num(value, format)

/** Onglet « Statistiques » : neuf blocs (titre en gras, en-têtes, lignes) séparés par une ligne vide. */
export function statsSheet(session: Session, stats: SessionStats, locale: Locale): SheetSpec {
  const { config } = session
  const label = (key: ExportMessageKey): string => exportText(locale, key, {})
  const times = (name: string, count: number): string =>
    exportText(locale, 'times', { label: name, count })
  const score = scoreFormat(config)
  const milli = (value: Milli | null): Cell =>
    optionalNum(value === null ? null : fromMilli(value), score)

  const block = (
    title: ExportMessageKey,
    columns: ExportMessageKey[],
    rows: Cell[][],
  ): Cell[][] => [[text(label(title), true)], header(columns.map(label)), ...rows]

  const { headcount, grades, adjustments } = stats
  const lastBin = stats.histogram.length - 1
  const blocks: Cell[][][] = [
    block(
      'stats_headcount',
      [
        'stats_headcount_total',
        'stats_headcount_done',
        'stats_headcount_in_progress',
        'stats_headcount_todo',
        'stats_headcount_absent',
        'stats_headcount_added',
      ],
      [
        [
          num(headcount.total),
          num(headcount.done),
          num(headcount.inProgress),
          num(headcount.todo),
          num(headcount.absent),
          num(headcount.addedDuringSession),
        ],
      ],
    ),
    block(
      'stats_grades',
      [
        'stats_grades_count',
        'stats_grades_min',
        'stats_grades_max',
        'stats_grades_mean',
        'stats_grades_median',
        'stats_grades_std_dev',
      ],
      [
        [
          num(grades.count),
          milli(grades.min),
          milli(grades.max),
          optionalNum(grades.mean, DECIMAL_2_FORMAT),
          optionalNum(grades.median, DECIMAL_2_FORMAT),
          optionalNum(grades.stdDev, DECIMAL_2_FORMAT),
        ],
      ],
    ),
    block(
      'stats_histogram',
      ['stats_col_range', 'stats_col_count'],
      stats.histogram.map((bin, index) => [
        text(binLabel(bin, index === lastBin, locale)),
        num(bin.count),
      ]),
    ),
    block(
      'stats_categories',
      ['col_category', 'stats_col_choices', 'stats_col_scored', 'stats_col_success_rate'],
      stats.categories.map((category) => [
        text(categoryLabel(config, category.categoryId)),
        num(category.choices),
        num(category.scored),
        optionalNum(category.successRate, RATE_FORMAT),
      ]),
    ),
    block(
      'stats_tags',
      ['stats_col_tag', 'stats_col_scored', 'stats_col_success_rate'],
      stats.tags.map((tag) => [
        text(tag.tag),
        num(tag.scored),
        optionalNum(tag.successRate, RATE_FORMAT),
      ]),
    ),
    block(
      'stats_top_drawn',
      ['stats_col_question', 'col_category', 'stats_col_draws'],
      stats.topDrawn.map((drawn) => [
        text(questionTitle(config, drawn.categoryId, drawn.questionId)),
        text(categoryLabel(config, drawn.categoryId)),
        num(drawn.count),
      ]),
    ),
    block(
      'stats_skipped',
      ['stats_col_question', 'col_category', 'stats_col_skips', 'stats_col_reasons'],
      stats.skipped.map((skipped) => [
        text(questionTitle(config, skipped.categoryId, skipped.questionId)),
        text(categoryLabel(config, skipped.categoryId)),
        num(skipped.total),
        text(reasonsLabel(skipped.reasons, label('no_reason'), times)),
      ]),
    ),
    block(
      'stats_strategies',
      ['stats_col_composition', 'stats_col_students', 'stats_col_mean_final'],
      stats.strategies.map((strategy) => [
        text(
          compositionLabel(
            strategy.composition.map(({ categoryId, count }) => ({
              label: categoryLabel(config, categoryId),
              count,
            })),
            times,
          ),
        ),
        num(strategy.students),
        num(strategy.meanFinal, DECIMAL_2_FORMAT),
      ]),
    ),
    block(
      'stats_adjustments',
      ['stats_adjustments_count', 'stats_adjustments_sum', 'stats_adjustments_mean'],
      [
        [
          num(adjustments.count),
          milli(adjustments.sum),
          optionalNum(adjustments.mean, DECIMAL_2_FORMAT),
        ],
      ],
    ),
  ]

  return {
    name: label('sheet_stats'),
    columns: [
      { width: 40 },
      { width: 24 },
      { width: 18 },
      { width: 18 },
      { width: 18 },
      { width: 18 },
    ],
    rows: blocks.flatMap((rows, index) => (index === 0 ? rows : [[], ...rows])),
  }
}
