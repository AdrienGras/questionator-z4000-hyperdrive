import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { findHeroIssues, main } from './check-readme-hero.ts'

const REDUCED_MOTION = '@media (prefers-reduced-motion: reduce){*{animation:none}}'

/** SVG minimal conforme, `extra` s'ajoute dans le style. */
const svgWith = (extra = '', body = ''): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><style>${REDUCED_MOTION}${extra}</style>${body}</svg>`

describe('findHeroIssues', () => {
  it('accepte un SVG conforme', () => {
    expect(findHeroIssues(svgWith())).toEqual([])
  })

  it('refuse <script>, onload et <foreignObject>', () => {
    expect(findHeroIssues(svgWith('', '<script>1</script>')).join()).toContain('script')
    expect(findHeroIssues(svgWith('', '<g onload="x()"/>')).join()).toContain('onload')
    expect(findHeroIssues(svgWith('', '<foreignObject/>')).join()).toContain('foreignObject')
  })

  it('refuse les href et url() externes', () => {
    expect(findHeroIssues(svgWith('', '<use href="https://x.test/a.svg"/>'))).not.toEqual([])
    expect(findHeroIssues(svgWith('', '<use xlink:href="http://x.test/a.svg"/>'))).not.toEqual([])
    expect(findHeroIssues(svgWith('.a{fill:url(https://x.test/g)}'))).not.toEqual([])
  })

  it('accepte les références internes', () => {
    expect(findHeroIssues(svgWith('.a{fill:url(#grad)}', '<use href="#leaf"/>'))).toEqual([])
  })

  it('refuse plus de 102 400 octets (UTF-8)', () => {
    const ok = svgWith('', `<!--${'a'.repeat(102_400 - svgWith('', '<!---->').length)}-->`)
    expect(Buffer.byteLength(ok)).toBe(102_400)
    expect(findHeroIssues(ok)).toEqual([])
    // « é » pèse 2 octets : 1 caractère de plus, 2 octets de plus.
    expect(findHeroIssues(ok.replace('<!--a', '<!--é')).join()).toContain('octets')
  })

  it('exige @media (prefers-reduced-motion: reduce)', () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg"><style>.a{fill:red}</style></svg>'
    expect(findHeroIssues(svg).join()).toContain('prefers-reduced-motion')
  })

  it('refuse animation-delay', () => {
    expect(findHeroIssues(svgWith('.a{animation-delay:1s}')).join()).toContain('animation-delay')
  })

  it('refuse un font-size inférieur à 40 (attribut et propriété), accepte 40', () => {
    expect(findHeroIssues(svgWith('', '<text font-size="32"/>')).join()).toContain('font-size')
    expect(findHeroIssues(svgWith('.a{font-size: 32px}')).join()).toContain('font-size')
    expect(findHeroIssues(svgWith('.a{font-size:40px}', '<text font-size="40"/>'))).toEqual([])
  })
})

describe('main', () => {
  const dirs: string[] = []
  afterEach(() => {
    for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
  })
  const write = (content: string): string => {
    const dir = mkdtempSync(join(tmpdir(), 'hero-'))
    dirs.push(dir)
    const file = join(dir, 'hero.svg')
    writeFileSync(file, content)
    return file
  }

  it('échoue en nommant le fichier, un message par problème', () => {
    const file = write(svgWith('.a{animation-delay:1s}', '<script/>'))
    const lines: string[] = []
    expect(main([file], (line) => lines.push(line))).toBe(1)
    expect(lines).toHaveLength(2)
    for (const line of lines) expect(line.startsWith(`${file} : `)).toBe(true)
  })

  it('réussit sur un fichier conforme', () => {
    expect(main([write(svgWith())], () => undefined)).toBe(0)
  })
})
