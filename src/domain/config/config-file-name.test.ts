import { describe, expect, test } from 'vitest'
import { configFileName } from '@/domain/config/config-file-name'

describe('configFileName', () => {
  test('slug du titre de l’examen', () => {
    expect(configFileName('{"exam": {"title": "Oral PHP"}}')).toBe('oral-php.json')
    expect(configFileName('{"exam": {"title": "  Écrit d’algèbre  "}}')).toBe(
      'ecrit-d-algebre.json',
    )
  })

  test('texte qui ne se parse pas : config.json', () => {
    expect(configFileName('pas du JSON')).toBe('config.json')
    expect(configFileName('')).toBe('config.json')
  })

  test('racine qui n’est pas un objet : config.json', () => {
    expect(configFileName('null')).toBe('config.json')
    expect(configFileName('[{"exam": {"title": "Oral"}}]')).toBe('config.json')
    expect(configFileName('"Oral"')).toBe('config.json')
  })

  test('exam absent ou qui n’est pas un objet : config.json', () => {
    expect(configFileName('{"schemaVersion": 1}')).toBe('config.json')
    expect(configFileName('{"exam": null}')).toBe('config.json')
    expect(configFileName('{"exam": "Oral"}')).toBe('config.json')
  })

  test('titre absent, vide, blanc ou qui n’est pas une chaîne : config.json', () => {
    expect(configFileName('{"exam": {}}')).toBe('config.json')
    expect(configFileName('{"exam": {"title": ""}}')).toBe('config.json')
    expect(configFileName('{"exam": {"title": "   "}}')).toBe('config.json')
    expect(configFileName('{"exam": {"title": 42}}')).toBe('config.json')
  })

  test('titre sans aucun caractère retenu par le slug : config.json, pas session.json', () => {
    expect(configFileName('{"exam": {"title": "!!!"}}')).toBe('config.json')
    expect(configFileName('{"exam": {"title": "日本語"}}')).toBe('config.json')
  })

  test('BOM en tête, accepté par la validation : le titre est lu', () => {
    expect(configFileName('﻿{"exam": {"title": "Oral PHP"}}')).toBe('oral-php.json')
  })

  test('le titre peut être n’importe où dans exam, le reste de la config est ignoré', () => {
    expect(configFileName('{"categories": [], "exam": {"date": "x", "title": "Oral"}}')).toBe(
      'oral.json',
    )
  })
})
