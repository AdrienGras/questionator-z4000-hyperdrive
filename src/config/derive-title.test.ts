import { describe, expect, test } from 'vitest'
import { deriveTitle, MAX_TITLE_LENGTH } from './derive-title'

describe('deriveTitle', () => {
  test('retire le markdown en gardant le texte du code en ligne', () => {
    expect(deriveTitle('Quelle différence entre `==` et `===` en PHP ?', 'q')).toBe(
      'Quelle différence entre == et === en PHP ?',
    )
    expect(deriveTitle('## Les **tableaux** et [la doc](https://php.net)', 'q')).toBe(
      'Les tableaux et la doc',
    )
    expect(deriveTitle('> - Citer _vraiment_ ~~pas~~ ![logo](x.png)', 'q')).toBe(
      'Citer vraiment pas logo',
    )
  })

  test('ne touche pas aux soulignés dans les mots ni dans le code', () => {
    expect(deriveTitle('Que fait `var_dump($_GET)` sur snake_case ?', 'q')).toBe(
      'Que fait var_dump($_GET) sur snake_case ?',
    )
  })

  test('ignore les blocs de code et prend la première ligne non vide', () => {
    const prompt = '```php\necho 1;\n```\n\n  \nQue vaut cette expression ?\nDeuxième ligne'
    expect(deriveTitle(prompt, 'q')).toBe('Que vaut cette expression ?')
  })

  test('prompt réduit à un bloc de code → première ligne de code', () => {
    expect(deriveTitle('```php\n\n$a = [1, 2];\n```', 'q')).toBe('$a = [1, 2];')
  })

  test('rien d’exploitable → fallback', () => {
    expect(deriveTitle('```\n```', 'facile-001')).toBe('facile-001')
    expect(deriveTitle('***', 'facile-002')).toBe('facile-002')
  })

  test('coupe à 60 caractères sur un mot, avec …', () => {
    const prompt =
      'Expliquez la différence entre une interface et une classe abstraite en PHP moderne'
    const title = deriveTitle(prompt, 'q')
    expect(title).toBe('Expliquez la différence entre une interface et une classe…')
    expect(title.length).toBeLessThanOrEqual(MAX_TITLE_LENGTH)
  })

  test('premier mot plus long que la limite → coupure franche', () => {
    expect(deriveTitle('a'.repeat(80), 'q')).toBe(`${'a'.repeat(59)}…`)
  })

  test('texte de 60 caractères ou moins inchangé', () => {
    const exact = 'b'.repeat(60)
    expect(deriveTitle(exact, 'q')).toBe(exact)
  })

  test('ligne de 50 000 caractères pathologique → traitée en moins de 200 ms', () => {
    const prompt = '**a '.repeat(12_500)
    const start = performance.now()
    const title = deriveTitle(prompt, 'q')
    const elapsed = performance.now() - start
    expect(elapsed).toBeLessThan(200)
    expect(title.length).toBeGreaterThan(0)
    expect(title.length).toBeLessThanOrEqual(MAX_TITLE_LENGTH)
  })
})
