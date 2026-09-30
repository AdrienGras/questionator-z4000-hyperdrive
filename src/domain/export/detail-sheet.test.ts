import { describe, expect, test } from 'vitest'
import { makeSession } from '@/testing/session-fixtures'
import { makeConfig, makeStudent } from '@/testing/student-fixtures'
import { date, num, text } from './cells'
import { detailSheet } from './detail-sheet'

const HEADERS_FR = [
  'Examinateur',
  'Étudiant',
  'Rang',
  'Catégorie',
  'Id question',
  'Titre',
  'Tags',
  'Résultat',
  'Points',
  'Points max',
  'Motif',
  'Tirée le',
  'Modifiée le',
]

describe('detailSheet', () => {
  test('13 en-têtes dans l’ordre de la spec, première ligne figée', () => {
    const sheet = detailSheet(makeSession({ students: [] }), 'fr')
    expect(sheet.name).toBe('Détail des questions')
    expect(sheet.stickyRows).toBe(1)
    expect(sheet.columns).toHaveLength(13)
    expect(sheet.rows).toEqual([HEADERS_FR.map((label) => text(label, true))])
  })

  test('trie par order puis rang ; un étudiant sans attempt n’a aucune ligne', () => {
    const session = makeSession({
      students: [
        makeStudent([1], { id: 's2', lastName: 'Zola', firstName: 'Zoé', order: 2 }),
        makeStudent([1, 2, 0], { id: 's1', order: 1 }),
        makeStudent([], { id: 's3', lastName: 'Vide', order: 3 }),
      ],
    })
    const rows = detailSheet(session, 'fr').rows.slice(1)
    expect(rows.map((row) => [row[1], row[2]])).toEqual([
      [text('Durand Alice'), num(1)],
      [text('Durand Alice'), num(2)],
      [text('Durand Alice'), num(3)],
      [text('Zola Zoé'), num(1)],
    ])
  })

  test('noté, passé et en cours', () => {
    const session = makeSession({
      config: makeConfig({ questionsPerStudent: 3 }),
      examiner: 'Mme Martin',
      students: [makeStudent([1.5, { skipped: 'Hors programme' }, 'pending'])],
    })
    const [scored, skipped, pending] = detailSheet(session, 'fr').rows.slice(1)
    expect(scored?.[0]).toEqual(text('Mme Martin'))
    expect(scored?.slice(3, 11)).toEqual([
      text('A'),
      text('a-1'),
      text('Question A1'),
      null,
      text('Noté'),
      num(1.5),
      num(2),
      null,
    ])
    expect(skipped?.[7]).toEqual(text('Passé'))
    expect(skipped?.[8]).toBeNull()
    expect(skipped?.[10]).toEqual(text('Hors programme'))
    expect(pending?.[7]).toEqual(text('En cours'))
    expect(pending?.[8]).toBeNull()
    expect(pending?.[10]).toBeNull()
  })

  test('tags joints par « , » ; dates au format de la langue ; editedAt absent → vide', () => {
    const session = makeSession({ students: [makeStudent([1])] })
    const question = session.config.categories[0]?.questions[0]
    if (question === undefined) throw new Error('fixture')
    question.tags = ['x', 'y']
    const student = session.students[0]
    if (student === undefined) throw new Error('fixture')
    const drawn = new Date('2026-09-25T09:00:00.000Z')
    const row = detailSheet(session, 'fr').rows[1]
    expect(row?.[6]).toEqual(text('x, y'))
    expect(row?.[11]).toEqual(date(drawn, 'dd/mm/yyyy hh:mm'))
    expect(row?.[12]).toBeNull()
    const attempt = student.attempts[0]
    if (attempt === undefined) throw new Error('fixture')
    attempt.editedAt = '2026-09-25T10:00:00.000Z'
    const en = detailSheet(session, 'en').rows[1]
    expect(en?.[11]).toEqual(date(drawn, 'yyyy-mm-dd hh:mm'))
    expect(en?.[12]).toEqual(date(new Date(attempt.editedAt), 'yyyy-mm-dd hh:mm'))
    expect(en?.[7]).toEqual(text('Scored'))
  })

  test('catégorie et question inconnues : ids écrits, libellé, titre et points max vides', () => {
    const student = makeStudent([1])
    const attempt = student.attempts[0]
    if (attempt === undefined) throw new Error('fixture')
    attempt.categoryId = 'zz'
    attempt.questionId = 'zz-9'
    const row = detailSheet(makeSession({ students: [student] }), 'fr').rows[1]
    expect(row?.slice(3, 10)).toEqual([
      text('zz'),
      text('zz-9'),
      null,
      null,
      text('Noté'),
      num(1),
      null,
    ])
  })

  test('question inconnue dans une catégorie connue : titre vide, points max du barème', () => {
    const student = makeStudent([1])
    const attempt = student.attempts[0]
    if (attempt === undefined) throw new Error('fixture')
    attempt.questionId = 'inconnue'
    const row = detailSheet(makeSession({ students: [student] }), 'fr').rows[1]
    expect(row?.[3]).toEqual(text('A'))
    expect(row?.[4]).toEqual(text('inconnue'))
    expect(row?.[5]).toBeNull()
    expect(row?.[9]).toEqual(num(2))
  })
})
