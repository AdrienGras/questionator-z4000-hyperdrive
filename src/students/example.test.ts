// @vitest-environment node
import { readFile } from 'node:fs/promises'
import { describe, expect, test } from 'vitest'
import { parseStudentsCsv } from './parse-csv'

const BOM = '﻿'

describe('students.example.csv', () => {
  test('se parse sans avertissement, avec les 10 étudiants attendus', async () => {
    const text = await readFile(
      new URL('../../examples/students.example.csv', import.meta.url),
      'utf8',
    )
    expect(text.startsWith(BOM)).toBe(true)
    const { students, issues } = parseStudentsCsv(text)
    expect(issues).toEqual([])
    expect(students).toHaveLength(10)
    expect(students[0]).toEqual({ lastName: 'Durand', firstName: 'Alice', line: 2 })
  })
})
