import { describe, expect, test } from 'vitest'
import { completionsAt, configJsonSchema, hoverAt, schemaAt } from './schema-assist'

/** `|` marque le curseur : renvoie le texte sans le marqueur et le décalage. */
function at(textWithCursor: string): [string, number] {
  const offset = textWithCursor.indexOf('|')
  return [textWithCursor.replace('|', ''), offset]
}

const root = configJsonSchema()

function complete(textWithCursor: string) {
  const [text, offset] = at(textWithCursor)
  return { text, offset, result: completionsAt(text, offset, root) }
}

function labels(textWithCursor: string): string[] | undefined {
  return complete(textWithCursor).result?.options.map((o) => o.label)
}

function hover(textWithCursor: string) {
  const [text, offset] = at(textWithCursor)
  return { text, hover: hoverAt(text, offset, root) }
}

describe('schemaAt', () => {
  test('suit clés, indices et branches anyOf', () => {
    expect(schemaAt(root, ['scoring', 'rounding', 'mode'])?.enum).toEqual(['nearest', 'up', 'down'])
    expect(schemaAt(root, ['categories', 0, 'questions', 3, 'prompt'])).toBeDefined()
    expect(schemaAt(root, ['categories', 0, 'icon'])).toBeDefined()
    expect(schemaAt(root, ['nope'])).toBeUndefined()
  })
})

describe('completionsAt : clés', () => {
  test('clés racine sur objet vide', () => {
    const { result } = complete('{ | }')
    const options = result?.options ?? []
    const names = options.map((o) => o.label)
    expect(names).toEqual(expect.arrayContaining(['schemaVersion', 'scoring', 'categories']))
    const scoring = options.find((o) => o.label === 'scoring')
    expect(scoring?.apply).toBe('"scoring": ')
    expect(scoring?.info).toBeTruthy()
  })

  test('exclut les clés déjà présentes', () => {
    const names = labels('{ "scoring": { "maxRawScore": 10, | } }')
    expect(names).toContain('questionsPerStudent')
    expect(names).not.toContain('maxRawScore')
  })

  test('clé en cours de frappe (chaîne non terminée)', () => {
    const { text, result } = complete('{ "scoring": { "qu|')
    expect(result?.options.map((o) => o.label)).toContain('questionsPerStudent')
    expect(result?.from).toBe(text.lastIndexOf('"'))
  })

  test('clé complétable même si elle est déjà complète sous le curseur', () => {
    const names = labels('{ "scoring": { "maxRawScore|": 10 } }')
    expect(names).toContain('maxRawScore')
  })

  test('curseur hors chaîne : plage vide et apply entre guillemets', () => {
    const { offset, result } = complete('{ "scoring": { "maxRawScore": 10, | } }')
    expect(result?.from).toBe(offset)
    expect(result?.to).toBe(offset)
    expect(result?.options[0]?.apply.startsWith('"')).toBe(true)
  })

  test('éléments de tableaux', () => {
    expect(labels('{ "categories": [ { | } ] }')).toEqual(
      expect.arrayContaining(['scale', 'questions']),
    )
    expect(labels('{ "categories": [ { "questions": [ {}, { | } ] } ] }')).toEqual(
      expect.arrayContaining(['prompt', 'answer']),
    )
  })

  test('clé inconnue, valeur libre, texte vide', () => {
    expect(complete('{ "foo": { | } }').result).toBeUndefined()
    expect(complete('{ "exam": { "title": | } }').result).toBeUndefined()
    expect(() => completionsAt('', 0, root)).not.toThrow()
  })
})

describe('completionsAt : valeurs', () => {
  test('enum après les deux-points', () => {
    expect(labels('{ "scoring": { "rounding": { "mode": | } } }')).toEqual([
      '"nearest"',
      '"up"',
      '"down"',
    ])
  })

  test('enum dans une chaîne : remplace la chaîne entière', () => {
    const { text, result } = complete('{ "scoring": { "rounding": { "mode": "ne|" } } }')
    expect(result?.options.map((o) => o.label)).toEqual(['"nearest"', '"up"', '"down"'])
    expect(result?.from).toBe(text.indexOf('"ne'))
    expect(result?.to).toBe(text.indexOf('"ne') + 4)
  })

  test('booléen et null', () => {
    expect(labels('{ "presentation": { "drawAnimation": | } }')).toEqual(['true', 'false'])
    expect(labels('{ "scoring": { "rounding": { "step": | } } }')).toContain('null')
  })

  test('locale, schemaVersion, icon', () => {
    expect(labels('{ "locale": | }')).toEqual(['"fr"', '"en"'])
    expect(labels('{ "schemaVersion": | }')).toEqual(['1'])
    expect(labels('{ "categories": [ { "icon": | } ] }')).toEqual(
      expect.arrayContaining(['"leaf"', '"brand-php"']),
    )
  })
})

describe('hoverAt', () => {
  test('description et plage de la clé guillemets compris', () => {
    const { text, hover: h } = hover('{ "scoring": { "roun|ding": {} } }')
    expect(h?.description).toBeTruthy()
    expect(h?.from).toBe(text.indexOf('"rounding"'))
    expect(h?.to).toBe(text.indexOf('"rounding"') + '"rounding"'.length)
  })

  test('valeur par défaut, y compris null', () => {
    const mode = hover('{ "scoring": { "rounding": { "mo|de": "up" } } }').hover
    expect(mode?.default).toBe('nearest')
    const step = hover('{ "scoring": { "rounding": { "st|ep": 1 } } }').hover
    expect(step).toBeDefined()
    expect('default' in (step ?? {})).toBe(true)
    expect(step?.default).toBeNull()
  })

  test('pas de survol sur une valeur', () => {
    expect(hover('{ "scoring": { "rounding": { "mode": "ne|arest" } } }').hover).toBeUndefined()
  })

  test('jeton de thème et icône de catégorie', () => {
    expect(hover('{ "theme": { "light": { "prim|ary": "#fff" } } }').hover?.description).toBe(
      'Variable CSS `--primary` du thème clair.',
    )
    expect(hover('{ "categories": [ { "ic|on": "leaf" } ] }').hover?.description).toContain(
      'Tabler',
    )
  })
})
