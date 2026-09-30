import { describe, expect, it } from 'vitest'
import { fenceLanguages } from '@/domain/config/code-fences'

describe('fenceLanguages', () => {
  it('lit un bloc délimité par des backticks', () => {
    expect(fenceLanguages('```python\nx = 1\n```')).toEqual(['python'])
  })

  it('lit un bloc délimité par des tildes', () => {
    expect(fenceLanguages('~~~Rust\nfn main() {}\n~~~')).toEqual(['rust'])
  })

  it("ne garde que le premier mot de l'info string", () => {
    expect(fenceLanguages('```php title=x\necho 1;\n```')).toEqual(['php'])
  })

  it("n'apporte rien pour un bloc sans langage", () => {
    expect(fenceLanguages('```\nbrut\n```')).toEqual([])
  })

  it("accepte de 0 à 3 espaces d'indentation", () => {
    expect(fenceLanguages('   ```js\nx\n   ```')).toEqual(['js'])
  })

  it("n'ouvre pas un bloc avec 4 espaces d'indentation", () => {
    expect(fenceLanguages('    ```js\nx\n    ```')).toEqual([])
  })

  it("ne lit pas une ouverture à l'intérieur d'un bloc", () => {
    expect(fenceLanguages('~~~\n```js\n~~~')).toEqual([])
  })

  it('ignore le code inline', () => {
    expect(fenceLanguages('du `x` et ```js``` en ligne')).toEqual([])
  })

  it('ferme le bloc avec un marqueur plus long', () => {
    expect(fenceLanguages('```py\nx\n`````\n```js\ny\n```')).toEqual(['py', 'js'])
  })

  it('ne ferme pas le bloc avec un marqueur plus court', () => {
    expect(fenceLanguages('````py\n```js\n```\n````')).toEqual(['py'])
  })

  it('garde les doublons, dans l’ordre', () => {
    expect(fenceLanguages('```python\na\n```\n\n```python\nb\n```')).toEqual(['python', 'python'])
  })

  it('traite un bloc jamais refermé jusqu’à la fin', () => {
    expect(fenceLanguages('```go\nx\n```js')).toEqual(['go'])
  })
})
