import { describe, expect, test } from 'vitest'
import { locateJsonError, parseJson } from './parse-json'

describe('parseJson', () => {
  test('JSON valide → valeur', () => {
    expect(parseJson('{"a":1}')).toEqual({ ok: true, value: { a: 1 } })
  })

  test('BOM UTF-8 en tête → ignoré', () => {
    expect(parseJson('﻿{"a":1}')).toEqual({ ok: true, value: { a: 1 } })
  })

  test('JSON mal formé → json_syntax avec ligne et colonne', () => {
    const result = parseJson('{\n "a": 1,\n }')
    expect(result).toEqual({
      ok: false,
      issue: { severity: 'error', code: 'json_syntax', path: [], params: { line: 3, column: 2 } },
    })
  })

  test('texte vide → json_syntax sans position', () => {
    expect(parseJson('')).toMatchObject({ ok: false, issue: { code: 'json_syntax', params: {} } })
  })
})

describe('locateJsonError', () => {
  const text = '{\n  "a": 1,\n  x\n}'

  test('message V8 avec ligne et colonne', () => {
    const message = 'Expected double-quoted property name in JSON at position 14 (line 3 column 3)'
    expect(locateJsonError(message, text)).toEqual({ line: 3, column: 3 })
  })

  test('message Firefox', () => {
    const message =
      'JSON.parse: expected double-quoted property name at line 3 column 3 of the JSON data'
    expect(locateJsonError(message, text)).toEqual({ line: 3, column: 3 })
  })

  test('position seule → ligne et colonne calculées', () => {
    expect(locateJsonError('Unexpected token x in JSON at position 14', text)).toEqual({
      line: 3,
      column: 3,
    })
  })

  test('aucune position (Safari) → rien', () => {
    expect(locateJsonError('JSON Parse error: Expected a property name', text)).toEqual({})
  })
})
