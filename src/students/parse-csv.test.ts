import { describe, expect, test } from 'vitest'
import { parseStudentsCsv } from './parse-csv'

const BOM = '﻿'

function names(text: string) {
  return parseStudentsCsv(text).students.map((s) => `${s.lastName} ${s.firstName}`)
}
function codes(text: string) {
  return parseStudentsCsv(text).issues.map((issue) => issue.code)
}

function headerReconnu(header: string) {
  expect(parseStudentsCsv(`${header}\nDurand;Alice`).students).toEqual([
    { lastName: 'Durand', firstName: 'Alice', line: 2 },
  ])
}

function noStudents(_label: string, text: string) {
  expect(parseStudentsCsv(text)).toEqual({
    students: [],
    issues: [{ severity: 'error', code: 'no_students', params: {} }],
  })
}

describe('parseStudentsCsv', () => {
  test('export Excel FR : BOM, ;, CRLF, ligne vide finale', () => {
    const result = parseStudentsCsv(`${BOM}Nom;Prénom\r\nDurand;Alice\r\nLefèvre;Chloé\r\n\r\n`)
    expect(result).toEqual({
      students: [
        { lastName: 'Durand', firstName: 'Alice', line: 2 },
        { lastName: 'Lefèvre', firstName: 'Chloé', line: 3 },
      ],
      issues: [],
    })
  })

  test('virgule sans en-tête : nom puis prénom', () => {
    expect(names('Durand,Alice\nMartin,Bruno')).toEqual(['Durand Alice', 'Martin Bruno'])
  })

  test('en-tête anglais en ordre inversé', () => {
    expect(names('First Name,Last Name\nAlice,Durand')).toEqual(['Durand Alice'])
  })

  test.each([
    'NOM;PRÉNOM',
    'nom de famille;prenom',
    'Last_Name;given-name',
    'Surname;FirstName',
    ' Family Name ; Prénom ',
  ])('en-tête reconnu : %s', headerReconnu)

  test('préambule de deux lignes ignoré avec un avertissement', () => {
    const result = parseStudentsCsv('Liste BTS SIO 2\nAnnée 2026\n\nNom;Prénom\nDurand;Alice')
    expect(result.students).toEqual([{ lastName: 'Durand', firstName: 'Alice', line: 5 }])
    expect(result.issues).toEqual([
      { severity: 'warning', code: 'preamble_skipped', params: { count: 2 } },
    ])
  })

  test('en-tête en 6ᵉ ligne utile : non reconnu, tout est donnée', () => {
    const text = ['a;b', 'c;d', 'e;f', 'g;h', 'i;j', 'Nom;Prénom', 'Durand;Alice'].join('\n')
    const result = parseStudentsCsv(text)
    expect(result.students).toHaveLength(7)
    expect(result.issues).toEqual([])
  })

  test('colonnes en trop : un seul avertissement avec le nombre de lignes', () => {
    const result = parseStudentsCsv('Nom;Prénom;Groupe\nDurand;Alice;A\nMartin;Bruno;B')
    expect(result.students).toHaveLength(2)
    expect(result.issues).toEqual([
      { severity: 'warning', code: 'extra_columns', params: { count: 2 } },
    ])
  })

  test('ligne à un seul champ ignorée, avec son numéro de ligne (lignes vides comptées)', () => {
    const result = parseStudentsCsv('Nom;Prénom\n\nDurand;Alice\nMartin;\n;Bruno')
    expect(names('Nom;Prénom\n\nDurand;Alice\nMartin;\n;Bruno')).toEqual(['Durand Alice'])
    expect(result.issues).toEqual([
      { severity: 'warning', code: 'single_field_row', line: 4, params: {} },
      { severity: 'warning', code: 'single_field_row', line: 5, params: {} },
    ])
  })

  test('doublons après normalisation (casse, accents, espaces) : gardés et signalés', () => {
    const result = parseStudentsCsv('Nom;Prénom\nLefèvre;Chloé\n lefevre ;CHLOE')
    expect(result.students).toHaveLength(2)
    expect(result.issues).toEqual([
      {
        severity: 'warning',
        code: 'duplicate_student',
        line: 3,
        params: { firstLine: 2, name: 'lefevre CHLOE' },
      },
    ])
  })

  test('trim et casse conservée', () => {
    expect(names('Nom;Prénom\n  de La Tour ;  Jean-Marc ')).toEqual(['de La Tour Jean-Marc'])
  })

  test('cellule entre guillemets contenant le séparateur', () => {
    expect(names('Nom;Prénom\n"Martin; Jr";Paul')).toEqual(['Martin; Jr Paul'])
  })

  test('guillemet non fermé : erreur csv_syntax, aucun étudiant', () => {
    const result = parseStudentsCsv('Nom;Prénom\n"Durand;Alice\nMartin;Bruno')
    expect(result.students).toEqual([])
    expect(result.issues).toEqual([
      expect.objectContaining({ severity: 'error', code: 'csv_syntax' }),
    ])
  })

  test('une seule colonne : lignes ignorées puis no_students, pas csv_syntax', () => {
    expect(codes('Durand\nMartin')).toEqual(['single_field_row', 'single_field_row', 'no_students'])
  })

  test.each([
    ['vide', ''],
    ['BOM seul', BOM],
    ['en-tête seul', 'Nom;Prénom\n'],
  ])('%s : no_students', noStudents)
})
