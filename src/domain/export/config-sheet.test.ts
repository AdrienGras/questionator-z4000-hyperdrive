import { describe, expect, test } from 'vitest'
import { makeSession } from '@/testing/session-fixtures'
import { makeConfig } from '@/testing/student-fixtures'
import { header, num, text } from './cells'
import { configSheet } from './config-sheet'

function sessionWith(scale: number[]) {
  const session = makeSession({
    config: makeConfig(
      { questionsPerStudent: 2, maxRawScore: 4, finalScale: 20, rounding: { step: 0.5 } },
      { export: 'value', value: 5.5 },
      { enabled: true, maxPerStudent: 2, reasons: ['Hors programme', 'Trop dur'] },
    ),
  })
  const category = session.config.categories[0]
  if (category === undefined) throw new Error('fixture')
  category.scale = scale
  return session
}

describe('configSheet', () => {
  test('bloc Catégories en français avec barème « 0 ; 0,5 ; 1 »', () => {
    const sheet = configSheet(sessionWith([0, 0.5, 1]), 'fr')
    expect(sheet.name).toBe('Configuration')
    expect(sheet.rows[0]).toEqual([text('Catégories', true)])
    expect(sheet.rows[1]).toEqual(header(['Libellé', 'Id', 'Ordre', 'Questions', 'Barème']))
    expect(sheet.rows[2]).toEqual([text('A'), text('a'), num(1), num(1), text('0 ; 0,5 ; 1')])
  })

  test('barème en anglais « 0; 0.5; 1 »', () => {
    const sheet = configSheet(sessionWith([0, 0.5, 1]), 'en')
    expect(sheet.rows[2]?.[4]).toEqual(text('0; 0.5; 1'))
  })

  test('paires réglage → valeur typées', () => {
    const rows = configSheet(sessionWith([0, 1]), 'fr').rows
    const start = rows.findIndex((row) => row.length === 0)
    expect(rows.slice(start + 1)).toEqual([
      header(['Paramètre', 'Valeur']),
      [text('Questions par étudiant'), num(2)],
      [text('Note brute max'), num(4)],
      [text('Échelle finale'), num(20)],
      [text('Arrondi (mode)'), text('Au plus proche')],
      [text('Arrondi (pas effectif)'), num(0.5)],
      [text('Passes activées'), text('Oui')],
      [text('Passes max par étudiant'), num(2)],
      [text('Motifs de passe'), text('Hors programme, Trop dur')],
      [text('Motif libre autorisé'), text('Oui')],
      [text('Absent (mode)'), text('Valeur')],
      [text('Absent (libellé)'), text('ABS')],
      [text('Absent (valeur)'), num(5.5)],
      [text('Version du schéma'), num(1)],
    ])
  })

  test('valeur d’absent et motifs absents → cellules vides', () => {
    const session = makeSession()
    const rows = configSheet(session, 'en').rows
    const find = (label: string) =>
      rows.find((row) => row[0]?.kind === 'text' && row[0].value === label)
    expect(find('Absent (value)')?.[1]).toBeNull()
    expect(find('Skip reasons')?.[1]).toBeNull()
  })
})
