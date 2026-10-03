import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, test } from 'vitest'

const REPO_URL = 'https://github.com/AdrienGras/questionator-z4000-hyperdrive'
const ROOT = join(import.meta.dirname, '..', '..')

/** Lien vers un fichier ou un dossier du dépôt sur `main`, avec ancre facultative. */
const REPO_LINK = new RegExp(
  `${REPO_URL}/(?:blob|tree)/main/([^\\s)#>"']+)(?:#([^\\s)>"']+))?`,
  'g',
)
const HEADING = /^#{1,6}\s+(.+?)\s*$/
const FENCE = /^\s*(```|~~~)/

interface RepoLink {
  page: string
  path: string
  anchor: string | undefined
}

/** Slug d'un titre selon GitHub : minuscules, ponctuation retirée, espaces en tirets, sans fusion. */
function githubSlug(heading: string): string {
  return heading
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\p{M}\s_-]/gu, '')
    .replaceAll(' ', '-')
}

/** Slugs des titres d'un fichier Markdown (hors blocs de code), doublons suffixés `-1`, `-2`… */
function listSlugs(markdown: string): Set<string> {
  const seen = new Map<string, number>()
  const slugs = new Set<string>()
  let fenced = false
  for (const line of markdown.split('\n')) {
    if (FENCE.test(line)) fenced = !fenced
    const title = fenced ? null : HEADING.exec(line)?.[1]
    if (!title) continue
    const base = githubSlug(title)
    const count = seen.get(base) ?? 0
    seen.set(base, count + 1)
    slugs.add(count === 0 ? base : `${base}-${count}`)
  }
  return slugs
}

function listLinks(dir: string): RepoLink[] {
  const links: RepoLink[] = []
  for (const file of readdirSync(dir).filter((name) => name.endsWith('.md'))) {
    const text = readFileSync(join(dir, file), 'utf8')
    for (const match of text.matchAll(REPO_LINK)) {
      links.push({
        page: file,
        path: decodeURIComponent(match[1]),
        anchor: match[2] === undefined ? undefined : decodeURIComponent(match[2]),
      })
    }
  }
  return links
}

function describeBroken({ page, path, anchor }: RepoLink): string | null {
  const target = join(ROOT, path)
  const label = `${page} → ${path}${anchor === undefined ? '' : `#${anchor}`}`
  if (!existsSync(target)) return `${label} : fichier ou dossier introuvable`
  if (anchor === undefined) return null
  if (!statSync(target).isFile() || !path.endsWith('.md')) {
    return `${label} : une ancre exige un fichier Markdown`
  }
  return listSlugs(readFileSync(target, 'utf8')).has(anchor) ? null : `${label} : ancre introuvable`
}

describe('liens du guide contributeur vers le dépôt', () => {
  const links = listLinks(import.meta.dirname)

  test('le guide renvoie assez souvent vers le dépôt', () => {
    expect(links.length).toBeGreaterThanOrEqual(10)
    expect(links.filter((link) => link.anchor !== undefined).length).toBeGreaterThanOrEqual(5)
  })

  test('chaque lien pointe un fichier, un dossier et une ancre qui existent', () => {
    const broken = links.map(describeBroken).filter((message) => message !== null)
    expect(broken).toEqual([])
  })

  test('le calcul des slugs suit GitHub', () => {
    expect(githubSlug('Arborescence et imports — squelette')).toBe(
      'arborescence-et-imports--squelette',
    )
    expect(githubSlug('Règle de fin d’implémentation (NON-NÉGOCIABLE)')).toBe(
      'règle-de-fin-dimplémentation-non-négociable',
    )
    expect([...listSlugs('## A\n\n## A\n\n```\n## B\n```\n## A')]).toEqual(['a', 'a-1', 'a-2'])
  })
})
