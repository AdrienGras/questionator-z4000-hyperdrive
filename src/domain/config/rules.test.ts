import { describe, expect, test } from 'vitest'
import { minimalConfig } from '@/testing/config-fixtures'
import { isKnownLanguage } from './code-languages'
import { ICON_NAME_SET } from './icon-names'
import type { ConfigIssue } from './issues'
import { checkRules, type RuleDeps } from './rules'
import type { ParsedConfig } from './schema'

const deps: RuleDeps = {
  cssSupports: (_property, value) => !value.startsWith('bad'),
  iconNames: new Set(['leaf', 'flame']),
  isKnownLanguage,
}

function codes(config: ParsedConfig): string[] {
  return checkRules(config, deps).map((issue) => issue.code)
}

function only(config: ParsedConfig, code: string): ConfigIssue[] {
  return checkRules(config, deps).filter((issue) => issue.code === code)
}

const fence = (lang: string) => '```' + lang + '\ncode\n```'
const withQuestion = (fields: { prompt?: string; answer?: string }): ParsedConfig => {
  const config = minimalConfig()
  const question = config.categories[0]!.questions[0]!
  Object.assign(question, fields)
  return config
}

function withSecondCategory(config: ParsedConfig, id: string, questionId: string): ParsedConfig {
  config.categories.push({
    id,
    label: 'B',
    scale: [0, 1],
    questions: [{ id: questionId, prompt: 'Question B' }],
  })
  return config
}

describe('checkRules', () => {
  test('la config minimale ne produit aucune issue', () => {
    expect(checkRules(minimalConfig(), deps)).toEqual([])
  })

  test('les noms d’icônes Tabler sont chargés', () => {
    expect(ICON_NAME_SET.size).toBeGreaterThan(6000)
    expect(ICON_NAME_SET.has('brand-php')).toBe(true)
  })

  test('duplicate_category_id sur la seconde occurrence', () => {
    const config = withSecondCategory(minimalConfig(), 'a', 'b-1')
    expect(only(config, 'duplicate_category_id')).toEqual([
      {
        severity: 'error',
        code: 'duplicate_category_id',
        path: ['categories', 1, 'id'],
        params: { id: 'a', firstPath: 'categories[0].id' },
      },
    ])
  })

  test('duplicate_question_id dans toute la config', () => {
    const config = withSecondCategory(minimalConfig(), 'b', 'a-1')
    expect(only(config, 'duplicate_question_id')).toEqual([
      {
        severity: 'error',
        code: 'duplicate_question_id',
        path: ['categories', 1, 'questions', 0, 'id'],
        params: { id: 'a-1', firstPath: 'categories[0].questions[0].id' },
      },
    ])
  })

  test('padded_id : espace en bord d’un id de catégorie ou de question', () => {
    const config = withSecondCategory(minimalConfig(), ' b', 'facile-001 ')
    expect(only(config, 'padded_id')).toEqual([
      {
        severity: 'error',
        code: 'padded_id',
        path: ['categories', 1, 'id'],
        params: { id: ' b' },
      },
      {
        severity: 'error',
        code: 'padded_id',
        path: ['categories', 1, 'questions', 0, 'id'],
        params: { id: 'facile-001 ' },
      },
    ])
  })

  test('unicode_variant_id : même id en NFC et en NFD, catégorie et question', () => {
    const nfc = '\u00e9'
    const nfd = 'e\u0301'
    const config = withSecondCategory(minimalConfig(), nfd, 'b-1')
    config.categories[0]!.id = nfc
    config.categories[0]!.questions[0]!.id = `q-${nfc}`
    config.categories[1]!.questions[0]!.id = `q-${nfd}`
    expect(only(config, 'unicode_variant_id')).toEqual([
      {
        severity: 'error',
        code: 'unicode_variant_id',
        path: ['categories', 1, 'id'],
        params: { id: nfd, firstPath: 'categories[0].id' },
      },
      {
        severity: 'error',
        code: 'unicode_variant_id',
        path: ['categories', 1, 'questions', 0, 'id'],
        params: { id: `q-${nfd}`, firstPath: 'categories[0].questions[0].id' },
      },
    ])
    expect(only(config, 'duplicate_category_id')).toEqual([])
  })

  test('variante NFD en premier puis deux ids NFC identiques : le second reste un doublon strict', () => {
    const config = withSecondCategory(minimalConfig(), '\u00e9', 'b-1')
    config.categories[0]!.id = 'e\u0301'
    withSecondCategory(config, '\u00e9', 'c-1')
    expect(checkRules(config, deps).map(({ code, path }) => [code, path])).toEqual(
      expect.arrayContaining([
        ['unicode_variant_id', ['categories', 1, 'id']],
        ['duplicate_category_id', ['categories', 2, 'id']],
      ]),
    )
    expect(only(config, 'unicode_variant_id')).toHaveLength(1)
  })

  test('ids réellement différents ou identiques : ni padded_id ni unicode_variant_id', () => {
    const different = withSecondCategory(minimalConfig(), 'e', 'b-1')
    const same = withSecondCategory(minimalConfig(), 'a', 'b-1')
    for (const config of [different, same]) {
      expect(only(config, 'padded_id')).toEqual([])
      expect(only(config, 'unicode_variant_id')).toEqual([])
    }
  })

  test('empty_scale', () => {
    const config = minimalConfig()
    config.categories[0]!.scale = []
    expect(only(config, 'empty_scale')[0]?.path).toEqual(['categories', 0, 'scale'])
  })

  test('negative_scale_value', () => {
    const config = minimalConfig()
    config.categories[0]!.scale = [-1, 2]
    expect(only(config, 'negative_scale_value')).toEqual([
      {
        severity: 'error',
        code: 'negative_scale_value',
        path: ['categories', 0, 'scale', 0],
        params: { value: -1 },
      },
    ])
  })

  test('duplicate_scale_value sur la seconde occurrence', () => {
    const config = minimalConfig()
    config.categories[0]!.scale = [0, 1, 1, 2]
    expect(only(config, 'duplicate_scale_value')[0]).toMatchObject({
      path: ['categories', 0, 'scale', 2],
      params: { value: 1 },
    })
  })

  test('zero_max_scale', () => {
    const config = minimalConfig()
    config.categories[0]!.scale = [0]
    expect(codes(config)).toContain('zero_max_scale')
  })

  test('category_without_questions', () => {
    const config = withSecondCategory(minimalConfig(), 'b', 'b-1')
    config.categories[1]!.questions = []
    config.scoring.questionsPerStudent = 1
    expect(only(config, 'category_without_questions')[0]?.path).toEqual([
      'categories',
      1,
      'questions',
    ])
  })

  test('not_enough_questions tient compte des skips activés', () => {
    const config = minimalConfig()
    config.skips = { enabled: true, maxPerStudent: 1 }
    expect(only(config, 'not_enough_questions')).toEqual([
      {
        severity: 'error',
        code: 'not_enough_questions',
        path: ['categories'],
        params: { total: 1, required: 2, skips: 1 },
      },
    ])
  })

  test('not_enough_questions : skips absents = activés, 1 par défaut', () => {
    const config = minimalConfig()
    delete config.skips
    expect(only(config, 'not_enough_questions')[0]?.params).toEqual({
      total: 1,
      required: 2,
      skips: 1,
    })
  })

  test('not_enough_questions : skips désactivés → skips 0', () => {
    const config = minimalConfig()
    config.scoring.questionsPerStudent = 2
    expect(only(config, 'not_enough_questions')[0]?.params).toEqual({
      total: 1,
      required: 2,
      skips: 0,
    })
  })

  test('missing_absent_value', () => {
    const config = minimalConfig()
    config.absent = { export: 'value' }
    expect(only(config, 'missing_absent_value')[0]?.path).toEqual(['absent', 'value'])
    config.absent.value = 0
    expect(only(config, 'missing_absent_value')).toEqual([])
  })

  test('too_many_decimals sur chaque valeur de notation', () => {
    const config = minimalConfig()
    config.categories[0]!.scale = [0, 1.0005, 2]
    config.scoring.maxRawScore = 2.0001
    config.scoring.finalScale = 20.00001
    config.scoring.rounding = { step: 0.0005 }
    config.absent = { export: 'value', value: 0.1234 }
    expect(only(config, 'too_many_decimals').map((issue) => issue.path)).toEqual([
      ['scoring', 'maxRawScore'],
      ['scoring', 'finalScale'],
      ['scoring', 'rounding', 'step'],
      ['absent', 'value'],
      ['categories', 0, 'scale', 1],
    ])
  })

  test('too_many_decimals : 3 décimales et flottants usuels acceptés', () => {
    const config = minimalConfig()
    config.categories[0]!.scale = [0, 0.1, 0.2, 1.005, 2]
    config.scoring.maxRawScore = 0.3
    expect(only(config, 'too_many_decimals')).toEqual([])
  })

  test('too_many_decimals : les grands entiers ne sont pas signalés', () => {
    const config = minimalConfig()
    config.scoring.maxRawScore = 1e20
    config.scoring.finalScale = 1e20
    expect(only(config, 'too_many_decimals')).toEqual([])
  })

  test('scoring_value_too_large au-delà de 10 000 en valeur absolue', () => {
    const config = minimalConfig()
    config.categories[0]!.scale = [0, 1, 10_001]
    config.scoring.maxRawScore = 10_000.5
    config.scoring.finalScale = 20_000
    config.scoring.rounding = { step: 10_001 }
    config.absent = { export: 'value', value: -10_001 }
    const issues = only(config, 'scoring_value_too_large')
    expect(issues.map((issue) => issue.path)).toEqual([
      ['scoring', 'maxRawScore'],
      ['scoring', 'finalScale'],
      ['scoring', 'rounding', 'step'],
      ['absent', 'value'],
      ['categories', 0, 'scale', 2],
    ])
    expect(issues[0]).toMatchObject({ severity: 'error', params: { value: 10_000.5, max: 10_000 } })
  })

  test('scoring_value_too_large : 10 000 accepté', () => {
    const config = minimalConfig()
    config.categories[0]!.scale = [0, 10_000]
    config.scoring.maxRawScore = 10_000
    config.scoring.finalScale = 10_000
    expect(only(config, 'scoring_value_too_large')).toEqual([])
  })

  test('une config à 1e20 produit des issues sans lever', () => {
    const config = minimalConfig()
    config.scoring.maxRawScore = 1e20
    config.scoring.finalScale = 1e20
    expect(() => checkRules(config, deps)).not.toThrow()
    expect(only(config, 'scoring_value_too_large')).toHaveLength(2)
  })

  test('invalid_css_value : couleurs de thème, radius et couleur de catégorie', () => {
    const config = minimalConfig()
    config.theme = { light: { primary: 'bad-color', radius: 'bad-radius' }, dark: { ring: 'red' } }
    config.categories[0]!.color = 'bad-tile'
    expect(only(config, 'invalid_css_value')).toEqual([
      {
        severity: 'error',
        code: 'invalid_css_value',
        path: ['theme', 'light', 'radius'],
        params: { property: 'border-radius', value: 'bad-radius' },
      },
      {
        severity: 'error',
        code: 'invalid_css_value',
        path: ['theme', 'light', 'primary'],
        params: { property: 'color', value: 'bad-color' },
      },
      {
        severity: 'error',
        code: 'invalid_css_value',
        path: ['categories', 0, 'color'],
        params: { property: 'color', value: 'bad-tile' },
      },
    ])
  })

  test('unreachable_max_score (avertissement)', () => {
    const config = minimalConfig()
    config.scoring.maxRawScore = 3
    expect(only(config, 'unreachable_max_score')).toEqual([
      {
        severity: 'warning',
        code: 'unreachable_max_score',
        path: ['scoring', 'maxRawScore'],
        params: { reachable: 2, maxRawScore: 3 },
      },
    ])
  })

  test('unreachable_max_score : pas de faux positif flottant', () => {
    const config = minimalConfig()
    config.scoring.questionsPerStudent = 3
    config.categories[0]!.scale = [0, 0.1]
    config.categories[0]!.questions.push({ id: 'a-2', prompt: 'Q2' }, { id: 'a-3', prompt: 'Q3' })
    config.scoring.maxRawScore = 0.3
    expect(only(config, 'unreachable_max_score')).toEqual([])
  })

  test('unreachable_max_score : reachable arrondi au millième, sans bruit flottant', () => {
    const config = minimalConfig()
    config.scoring.questionsPerStudent = 3
    config.categories[0]!.scale = [0, 0.1]
    config.categories[0]!.questions.push({ id: 'a-2', prompt: 'Q2' }, { id: 'a-3', prompt: 'Q3' })
    config.scoring.maxRawScore = 1
    expect(only(config, 'unreachable_max_score')[0]?.params).toEqual({
      reachable: 0.3,
      maxRawScore: 1,
    })
  })

  test('final_scale_off_grid avec un pas explicite (erreur)', () => {
    const config = minimalConfig()
    config.scoring.rounding = { step: 0.3 }
    expect(only(config, 'final_scale_off_grid')).toEqual([
      {
        severity: 'error',
        code: 'final_scale_off_grid',
        path: ['scoring', 'finalScale'],
        params: { finalScale: 20, step: 0.3 },
      },
    ])
  })

  test('final_scale_off_grid : pas dérivé de decimals, et pas de faux positif flottant', () => {
    const decimals = minimalConfig()
    decimals.scoring.finalScale = 20.5
    decimals.scoring.rounding = { decimals: 0 }
    expect(only(decimals, 'final_scale_off_grid')[0]?.params).toEqual({ finalScale: 20.5, step: 1 })
    const float = minimalConfig()
    float.scoring.finalScale = 0.3
    float.scoring.maxRawScore = 0.3
    float.scoring.rounding = { step: 0.1 }
    expect(only(float, 'final_scale_off_grid')).toEqual([])
  })

  test('unknown_icon (avertissement)', () => {
    const config = minimalConfig()
    config.categories[0]!.icon = 'licorne'
    expect(only(config, 'unknown_icon')).toEqual([
      {
        severity: 'warning',
        code: 'unknown_icon',
        path: ['categories', 0, 'icon'],
        params: { icon: 'licorne' },
      },
    ])
    config.categories[0]!.icon = 'leaf'
    expect(only(config, 'unknown_icon')).toEqual([])
  })

  describe('unknown_code_language (avertissement)', () => {
    test('levée dans l’énoncé, avec sévérité et paramètres attendus', () => {
      const config = withQuestion({ prompt: fence('pyhton') })
      const questionId = config.categories[0]!.questions[0]!.id
      expect(only(config, 'unknown_code_language')).toEqual([
        {
          severity: 'warning',
          code: 'unknown_code_language',
          path: ['categories', 0, 'questions', 0, 'prompt'],
          params: { language: 'pyhton', questionId },
        },
      ])
    })

    test('levée dans la réponse', () => {
      const config = withQuestion({ answer: fence('pyhton') })
      expect(only(config, 'unknown_code_language').map((issue) => issue.path)).toEqual([
        ['categories', 0, 'questions', 0, 'answer'],
      ])
    })

    test('un même langage dans l’énoncé et la réponse donne une seule issue, sur l’énoncé', () => {
      const config = withQuestion({ prompt: fence('pyhton'), answer: fence('pyhton') })
      expect(only(config, 'unknown_code_language').map((issue) => issue.path)).toEqual([
        ['categories', 0, 'questions', 0, 'prompt'],
      ])
    })

    test('deux langages inconnus distincts donnent deux issues', () => {
      const config = withQuestion({ prompt: `${fence('pyhton')}\n\n${fence('rusty')}` })
      expect(only(config, 'unknown_code_language').map((issue) => issue.params)).toEqual([
        expect.objectContaining({ language: 'pyhton' }),
        expect.objectContaining({ language: 'rusty' }),
      ])
    })

    test('non évaluée sans `isKnownLanguage` injecté (lecture du stockage, backup)', () => {
      const config = withQuestion({ prompt: fence('pyhton') })
      const { isKnownLanguage: _omitted, ...withoutLanguages } = deps
      const issues = checkRules(config, withoutLanguages)
      expect(issues.filter((issue) => issue.code === 'unknown_code_language')).toEqual([])
    })

    test('absente pour les langages connus, les pseudo-langages et les blocs sans langage', () => {
      const prompt = ['python', 'py', 'PHP', 'text', ''].map(fence).join('\n\n')
      expect(only(withQuestion({ prompt }), 'unknown_code_language')).toEqual([])
    })
  })
})
