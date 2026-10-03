import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { describe, expect, test } from 'vitest'

const ROOT = join(import.meta.dirname, '..')
const REPO_URL = 'https://github.com/AdrienGras/questionator-z4000-hyperdrive'
const DOCS_URL = 'https://adriengras.github.io/questionator-z4000-hyperdrive/docs/'

/** Fichiers communautaires du dépôt (#125) : README, guides et modèles GitHub. */
const FILES = [
  'README.md',
  'CONTRIBUTING.md',
  'CODE_OF_CONDUCT.md',
  'SECURITY.md',
  '.github/pull_request_template.md',
  ...readdirSync(join(ROOT, '.github/ISSUE_TEMPLATE')).map(
    (name) => `.github/ISSUE_TEMPLATE/${name}`,
  ),
]

/** Cible d'un lien Markdown `](cible)`, sans titre. */
const MARKDOWN_TARGET = /\]\(([^)\s]+)\)/g
const REPO_LINK = new RegExp(`${REPO_URL}/(?:blob|tree)/main/([^\\s)#>"'|]+)`, 'g')
const DOCS_LINK = new RegExp(`${DOCS_URL}([^\\s)#>"'|]*)(?:#([^\\s)>"'|]+))?`, 'g')

/** Slug d'un titre selon VitePress (`@mdit-vue/shared`) : sans accents ni ponctuation. */
function vitepressSlug(heading: string): string {
  return heading
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[\s~`!@#$%^&*()\-_+=[\]{}|\\;:"'“”‘’<>,.?/]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/^(\d)/, '_$1')
    .toLowerCase()
}

/** Ancres d'une page du site : `{#id}` explicites, sinon slug du titre. */
function listAnchors(markdown: string): Set<string> {
  const anchors = new Set<string>()
  const prose = markdown.replace(/^```[\s\S]*?^```/gm, '')
  for (const [, title] of prose.matchAll(/^#{1,6}\s+(.+?)\s*$/gm)) {
    const explicit = /\{#([^}]+)\}$/.exec(title)
    anchors.add(explicit ? explicit[1] : vitepressSlug(title.replaceAll('`', '')))
  }
  return anchors
}

function read(file: string): string {
  return readFileSync(join(ROOT, file), 'utf8')
}

/** Lien relatif d'un fichier vers un autre fichier du dépôt (hors URL et ancre seule). */
function brokenRelativeLinks(file: string): string[] {
  return [...read(file).matchAll(MARKDOWN_TARGET)]
    .map((match) => match[1])
    .filter((target) => !/^[a-z]+:/.test(target) && !target.startsWith('#'))
    .map((target) => decodeURIComponent(target.split('#')[0]))
    .filter((path) => !existsSync(join(ROOT, dirname(file), path)))
    .map((path) => `${file} → ${path}`)
}

function brokenRepoLinks(file: string): string[] {
  return [...read(file).matchAll(REPO_LINK)]
    .map((match) => decodeURIComponent(match[1]))
    .filter((path) => !existsSync(join(ROOT, path)))
    .map((path) => `${file} → ${path}`)
}

function brokenDocsLinks(file: string): string[] {
  return [...read(file).matchAll(DOCS_LINK)].flatMap(([, page, anchor]) => {
    const source = join('site', page === '' ? 'index.md' : page.replace(/\.html$/, '.md'))
    const label = `${file} → ${page}${anchor === undefined ? '' : `#${anchor}`}`
    if (!existsSync(join(ROOT, source))) return [`${label} : page introuvable`]
    if (anchor === undefined || listAnchors(read(source)).has(anchor)) return []
    return [`${label} : ancre introuvable`]
  })
}

describe('liens des fichiers communautaires', () => {
  test('chaque lien relatif pointe un fichier du dépôt', () => {
    expect(FILES.flatMap(brokenRelativeLinks)).toEqual([])
  })

  test('chaque lien vers le dépôt pointe un fichier de main', () => {
    expect(FILES.flatMap(brokenRepoLinks)).toEqual([])
  })

  test('chaque lien vers la documentation pointe une page et une ancre du site', () => {
    expect(FILES.flatMap(brokenDocsLinks)).toEqual([])
  })

  test('le README renvoie vers la doc, les exemples et la licence', () => {
    const readme = read('README.md')
    expect(readme).toContain('](examples/config.example.json)')
    expect(readme).toContain('](LICENSE)')
    expect([...readme.matchAll(DOCS_LINK)].length).toBeGreaterThanOrEqual(5)
  })

  test('le calcul des slugs suit VitePress', () => {
    expect(vitepressSlug('Vos données restent sur votre appareil')).toBe(
      'vos-donnees-restent-sur-votre-appareil',
    )
    expect(vitepressSlug("Construire l'app avant la doc")).toBe('construire-l-app-avant-la-doc')
    expect([...listAnchors('## Titre {#id}\n### `skips`')]).toEqual(['id', 'skips'])
  })
})
