import { describe, expect, test } from 'vitest'
import { makeSession } from '@/testing/session-fixtures'
import { date, header, text } from './cells'
import { metadataSheet } from './metadata-sheet'

const NOW = new Date('2026-09-30T12:00:00.000Z')

describe('metadataSheet', () => {
  test('paires réglage → valeur avec dates typées (fr)', () => {
    const session = makeSession({ examiner: 'Mme Martin' })
    session.config.exam.subject = 'Maths'
    session.config.exam.cohort = 'L3'
    const sheet = metadataSheet(session, 'fr', NOW)
    expect(sheet.name).toBe('Métadonnées')
    expect(sheet.rows).toEqual([
      header(['Paramètre', 'Valeur']),
      [text('Nom de la session'), text('Oral de test')],
      [text('Examinateur'), text('Mme Martin')],
      [text('Titre de l’examen'), text('Oral de test')],
      [text('Matière'), text('Maths')],
      [text('Promotion'), text('L3')],
      [text('Créée le'), date(new Date('2026-09-25T08:00:00.000Z'), 'dd/mm/yyyy hh:mm')],
      [text('Exportée le'), date(NOW, 'dd/mm/yyyy hh:mm')],
      [text('Version de l’application'), text('0.1.0')],
    ])
  })

  test('matière, promo et examinateur absents → null ; format anglais', () => {
    const sheet = metadataSheet(makeSession(), 'en', NOW)
    expect(sheet.rows[2]).toEqual([text('Examiner'), null])
    expect(sheet.rows[4]).toEqual([text('Subject'), null])
    expect(sheet.rows[5]).toEqual([text('Cohort'), null])
    expect(sheet.rows[7]).toEqual([text('Exported at'), date(NOW, 'yyyy-mm-dd hh:mm')])
  })
})
