import { describe, expect, test } from 'vitest'
import { locateFromEngineMessage, parseJson } from './parse-json'

function locationOf(text: string) {
  const result = parseJson(text)
  if (result.ok) throw new Error('le JSON aurait dû être refusé')
  return result.issue.params
}

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

  test('BOM UTF-8 puis JSON mal formé → position comptée sans le BOM', () => {
    expect(locationOf('﻿{\n "a": 1,\n }')).toEqual({ line: 3, column: 2 })
  })

  test('virgule finale dans un tableau → position du crochet fermant', () => {
    expect(locationOf('[\n  1,\n  2,\n]')).toEqual({ line: 4, column: 1 })
  })

  test('commentaire // → position du commentaire', () => {
    expect(locationOf('{\n  // note\n  "a": 1\n}')).toEqual({ line: 2, column: 3 })
  })

  test('guillemets simples → position de la clé', () => {
    expect(locationOf("{\n  'a': 1\n}")).toEqual({ line: 2, column: 3 })
  })

  test('valeur manquante → position de l’accolade fermante', () => {
    expect(locationOf('{\n  "b": \n}')).toEqual({ line: 3, column: 1 })
  })

  test('texte vide → ligne 1, colonne 1', () => {
    expect(locationOf('')).toEqual({ line: 1, column: 1 })
  })

  test('une prompt citant « position 3 (line 9 column 9) » ne fausse pas la localisation', () => {
    const text = '{"p": "position 3 (line 9 column 9)",\n  "b": }'
    expect(locationOf(text)).toEqual({ line: 2, column: 8 })
  })
})

describe('locateFromEngineMessage', () => {
  const text = '{\n  "a": 1,\n  x\n}'

  test.each([
    [
      'message V8 avec ligne et colonne',
      'Expected double-quoted property name in JSON at position 14 (line 3 column 3)',
    ],
    [
      'message V8 avec la position seule → ligne et colonne calculées',
      'Expected double-quoted property name in JSON at position 14',
    ],
    [
      'message Firefox',
      'JSON.parse: expected double-quoted property name at line 3 column 3 of the JSON data',
    ],
  ])('%s', (_description, message) => {
    expect(locateFromEngineMessage(message, text)).toEqual({ line: 3, column: 3 })
  })

  test('extrait du source cité dans le message → ignoré', () => {
    const message = `Unexpected token '}', "{"p": "position 3 (line 9 column 9)", "b": }" is not valid JSON`
    expect(locateFromEngineMessage(message, text)).toEqual({})
  })

  test('aucune position (Safari) → rien', () => {
    expect(locateFromEngineMessage('JSON Parse error: Expected a property name', text)).toEqual({})
  })
})
