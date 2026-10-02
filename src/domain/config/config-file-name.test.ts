import { describe, expect, test } from 'vitest'
import { configFileName } from '@/domain/config/config-file-name'

describe('configFileName', () => {
  test.each([
    ['slug du titre de l’examen', '{"exam": {"title": "Oral PHP"}}', 'oral-php.json'],
    [
      'titre accentué et entouré de blancs',
      '{"exam": {"title": "  Écrit d’algèbre  "}}',
      'ecrit-d-algebre.json',
    ],
    ['BOM en tête, accepté par la validation', '﻿{"exam": {"title": "Oral PHP"}}', 'oral-php.json'],
    [
      'titre n’importe où dans exam, reste de la config ignoré',
      '{"categories": [], "exam": {"date": "x", "title": "Oral"}}',
      'oral.json',
    ],
  ])('%s', (_case, text, expected) => {
    expect(configFileName(text)).toBe(expected)
  })

  // Repli `config.json` : rien d'exploitable pour nommer le fichier.
  test.each([
    ['texte qui ne se parse pas', 'pas du JSON'],
    ['texte vide', ''],
    ['racine null', 'null'],
    ['racine tableau', '[{"exam": {"title": "Oral"}}]'],
    ['racine chaîne', '"Oral"'],
    ['exam absent', '{"schemaVersion": 1}'],
    ['exam null', '{"exam": null}'],
    ['exam chaîne', '{"exam": "Oral"}'],
    ['titre absent', '{"exam": {}}'],
    ['titre vide', '{"exam": {"title": ""}}'],
    ['titre blanc', '{"exam": {"title": "   "}}'],
    ['titre non textuel', '{"exam": {"title": 42}}'],
    ['titre sans caractère retenu par le slug (pas session.json)', '{"exam": {"title": "!!!"}}'],
    ['titre en écriture non latine', '{"exam": {"title": "日本語"}}'],
  ])('%s : config.json', (_case, text) => {
    expect(configFileName(text)).toBe('config.json')
  })
})
