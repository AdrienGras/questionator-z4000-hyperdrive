import type { Session } from '@/domain/session/types'
import { fromMilli } from '@/domain/scoring/milli'
import { stepMilli } from '@/domain/scoring/rounding'
import type { Locale } from '@/lib/i18n/i18n'
import { header, num, optionalText, text } from './cells'
import { exportText, type ExportMessageKey } from './messages'
import type { Cell, SheetSpec } from './types'

const ROUNDING_KEYS = {
  nearest: 'rounding_nearest',
  up: 'rounding_up',
  down: 'rounding_down',
} as const satisfies Record<string, ExportMessageKey>

const ABSENT_KEYS = {
  label: 'absent_mode_label',
  zero: 'absent_mode_zero',
  value: 'absent_mode_value',
} as const satisfies Record<string, ExportMessageKey>

/** Barème dans la langue : « 0 ; 0,5 ; 1 » en fr, « 0; 0.5; 1 » en en. */
function scaleText(scale: number[], locale: Locale): string {
  const formatter = new Intl.NumberFormat(locale, { maximumFractionDigits: 3 })
  return scale.map((value) => formatter.format(value)).join(locale === 'fr' ? ' ; ' : '; ')
}

/** Onglet « Configuration » : bloc Catégories puis paires réglage → valeur. */
export function configSheet(session: Session, locale: Locale): SheetSpec {
  const { config } = session
  const label = (key: ExportMessageKey): string => exportText(locale, key, {})
  const yesNo = (value: boolean): Cell => text(label(value ? 'yes' : 'no'))
  const pair = (key: ExportMessageKey, value: Cell): Cell[] => [text(label(key)), value]

  const categoryRows = config.categories.map((category) => [
    text(category.label),
    text(category.id),
    num(category.order),
    num(category.questions.length),
    text(scaleText(category.scale, locale)),
  ])

  return {
    name: label('sheet_config'),
    columns: [{ width: 32 }, { width: 24 }, { width: 12 }, { width: 12 }, { width: 24 }],
    rows: [
      [text(label('config_categories'), true)],
      header([
        label('col_label'),
        label('col_id'),
        label('col_order'),
        label('col_questions'),
        label('col_scale'),
      ]),
      ...categoryRows,
      [],
      header([label('col_setting'), label('col_value')]),
      pair('config_questions_per_student', num(config.scoring.questionsPerStudent)),
      pair('config_max_raw_score', num(config.scoring.maxRawScore)),
      pair('config_final_scale', num(config.scoring.finalScale)),
      pair('config_rounding_mode', text(label(ROUNDING_KEYS[config.scoring.rounding.mode]))),
      pair('config_rounding_step', num(fromMilli(stepMilli(config)))),
      pair('config_skips_enabled', yesNo(config.skips.enabled)),
      pair('config_skips_max_per_student', num(config.skips.maxPerStudent)),
      pair('config_skips_reasons', optionalText(config.skips.reasons.join(', '))),
      pair('config_skips_free_text', yesNo(config.skips.allowFreeText)),
      pair('config_absent_mode', text(label(ABSENT_KEYS[config.absent.export]))),
      pair('config_absent_label', optionalText(config.absent.label)),
      pair(
        'config_absent_value',
        config.absent.value === undefined ? null : num(config.absent.value),
      ),
      pair('config_schema_version', num(config.schemaVersion)),
    ],
  }
}
