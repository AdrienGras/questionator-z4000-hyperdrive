import { describe, expect, test } from 'vitest'
import type { ParsedConfig } from '@/domain/config/schema'
import type { Session } from '@/domain/session/types'
import { makeSession } from '@/testing/session-fixtures'
import { makeConfig, makeStudent } from '@/testing/student-fixtures'
import { num, text } from './cells'
import { summarySheet } from './summary-sheet'

const HEADERS_FR = [
  'Examinateur',
  'Nom',
  'Prénom',
  'Ordre',
  'Statut',
  'Ajouté en cours de session',
  'Brute',
  'Plafonnée',
  'Convertie',
  'Ajustement',
  'Justification',
  'Finale',
  'Commentaire',
]

function sessionFor(absent?: ParsedConfig['absent'], examiner?: string): Session {
  const config = makeConfig({ questionsPerStudent: 2, rounding: { step: 0.5 } }, absent)
  return makeSession({
    config,
    ...(examiner !== undefined && { examiner }),
    students: [
      makeStudent([2, 1], {
        id: 'done',
        order: 3,
        adjustment: { value: -1.5, reason: 'Oral hésitant' },
        comment: '=1+1',
      }),
      makeStudent([1], { id: 'in-progress', lastName: 'Bernard', firstName: 'Bob', order: 1 }),
      makeStudent([], {
        id: 'todo',
        lastName: 'Chevalier',
        firstName: 'Chloé',
        order: 2,
        addedDuringSession: true,
      }),
      makeStudent([], {
        id: 'absent',
        lastName: 'Dupont',
        firstName: 'Denis',
        order: 4,
        absent: true,
      }),
    ],
  })
}

describe('summarySheet', () => {
  test('en-têtes en gras, première ligne figée, largeurs par colonne', () => {
    const sheet = summarySheet(sessionFor(), 'fr')
    expect(sheet.name).toBe('Synthèse')
    expect(sheet.stickyRows).toBe(1)
    expect(sheet.rows[0]).toEqual(HEADERS_FR.map((label) => text(label, true)))
    expect(sheet.columns).toHaveLength(HEADERS_FR.length)
  })

  test('une ligne par étudiant, triée par ordre, statuts et notes', () => {
    const rows = summarySheet(sessionFor(undefined, 'Mme Martin'), 'fr').rows.slice(1)
    expect(rows).toEqual([
      [
        text('Mme Martin'),
        text('Bernard'),
        text('Bob'),
        num(1),
        text('En cours'),
        text('Non'),
        num(1),
        num(1),
        null,
        null,
        null,
        null,
        null,
      ],
      [
        text('Mme Martin'),
        text('Chevalier'),
        text('Chloé'),
        num(2),
        text('À passer'),
        text('Oui'),
        num(0),
        num(0),
        null,
        null,
        null,
        null,
        null,
      ],
      [
        text('Mme Martin'),
        text('Durand'),
        text('Alice'),
        num(3),
        text('Terminé'),
        text('Non'),
        num(3),
        num(2),
        num(20, '0.0'),
        num(-1.5, '0.0'),
        text('Oral hésitant'),
        num(18.5, '0.0'),
        text('=1+1'),
      ],
      [
        text('Mme Martin'),
        text('Dupont'),
        text('Denis'),
        num(4),
        text('Absent'),
        text('Non'),
        null,
        null,
        null,
        null,
        null,
        text('ABS'),
        null,
      ],
    ])
  })

  test('commentaire d’apparence formule : cellule texte', () => {
    const rows = summarySheet(sessionFor(), 'fr').rows
    expect(rows[3]?.[12]).toEqual({ kind: 'text', value: '=1+1' })
  })

  test('examinateur absent : colonne vide', () => {
    const rows = summarySheet(sessionFor(), 'fr').rows.slice(1)
    expect(rows.map((row) => row[0])).toEqual([null, null, null, null])
  })

  test('absent en mode label avec libellé personnalisé : texte du libellé', () => {
    const rows = summarySheet(sessionFor({ export: 'label', label: 'Non présenté' }), 'fr').rows
    expect(rows[4]?.[11]).toEqual(text('Non présenté'))
  })

  test('absent en mode zero : nombre au format du pas', () => {
    const rows = summarySheet(sessionFor({ export: 'zero' }), 'fr').rows
    expect(rows[4]?.[11]).toEqual(num(0, '0.0'))
  })

  test('absent en mode value décimale : nombre au format du pas, pas du texte', () => {
    const rows = summarySheet(sessionFor({ export: 'value', value: 5.5 }), 'fr').rows
    expect(rows[4]?.[11]).toEqual(num(5.5, '0.0'))
  })

  test('absent en mode value plus fine que le pas : format de la valeur', () => {
    const rows = summarySheet(sessionFor({ export: 'value', value: 5.25 }), 'fr').rows
    expect(rows[4]?.[11]).toEqual(num(5.25, '0.00'))
  })

  test('en-têtes et statuts en anglais', () => {
    const sheet = summarySheet(sessionFor(), 'en')
    expect(sheet.name).toBe('Summary')
    expect(sheet.rows[0]?.[0]).toEqual(text('Examiner', true))
    expect(sheet.rows[0]?.[12]).toEqual(text('Comment', true))
    expect(sheet.rows.slice(1).map((row) => row[4])).toEqual([
      text('In progress'),
      text('Not started'),
      text('Finished'),
      text('Absent'),
    ])
    expect(sheet.rows[2]?.[5]).toEqual(text('Yes'))
  })

  test('session sans étudiant : en-têtes seuls', () => {
    expect(summarySheet(makeSession({ students: [] }), 'fr').rows).toHaveLength(1)
  })
})
