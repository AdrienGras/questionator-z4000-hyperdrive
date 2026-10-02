import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  findDocsEntries,
  findMissing,
  listDistFiles,
  main,
  readPrecacheUrls,
} from './check-precache.ts'

const SW_EXTRACT =
  'e.precacheAndRoute([{url:"students.example.csv",revision:"65a0fb9fcfd6dbe3371e8299bf0158c4"},' +
  '{url:"assets/xlsx-DuHD0Kam.js",revision:null},' +
  '{revision:"f57bf4e620aefc1de531a72cad7e4705",url:\'index.html\'}],{})'

const dirs: string[] = []
afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

/** Crée une arborescence `dist` temporaire à partir de `{ chemin: contenu }`. */
function makeDist(files: Record<string, string>): string {
  const root = mkdtempSync(join(tmpdir(), 'precache-'))
  dirs.push(root)
  for (const [path, content] of Object.entries(files)) {
    const full = join(root, path)
    mkdirSync(join(full, '..'), { recursive: true })
    writeFileSync(full, content)
  }
  return root
}

const swWith = (...urls: string[]): string =>
  `precacheAndRoute([${urls.map((url) => `{url:"${url}",revision:null}`).join(',')}])`

describe('readPrecacheUrls', () => {
  it('lit les url d’un sw minifié', () => {
    expect(readPrecacheUrls(SW_EXTRACT)).toEqual([
      'students.example.csv',
      'assets/xlsx-DuHD0Kam.js',
      'index.html',
    ])
  })

  it('renvoie [] pour une source sans manifeste', () => {
    expect(readPrecacheUrls('self.addEventListener("message",()=>{})')).toEqual([])
  })
})

describe('listDistFiles', () => {
  it('ignore sw.js, workbox-*.js et .vite/', () => {
    const root = makeDist({
      'index.html': '',
      'assets/a.js': '',
      'sw.js': '',
      'workbox-abc.js': '',
      '.vite/manifest.json': '',
    })
    expect(listDistFiles(root)).toEqual(['assets/a.js', 'index.html'])
  })
})

describe('findMissing', () => {
  it('nomme le fichier absent du pré-cache', () => {
    expect(findMissing(['index.html', 'assets/_tabler.js'], ['index.html'])).toEqual([
      'assets/_tabler.js',
    ])
  })

  it('ne signale rien quand tout est pré-caché', () => {
    expect(findMissing(['index.html'], ['index.html', 'extra.js'])).toEqual([])
  })
})

describe('main', () => {
  it('échoue en nommant les fichiers absents du pré-cache', () => {
    const root = makeDist({
      'sw.js': swWith('index.html'),
      'index.html': '',
      'assets/icons-abc.js': '',
    })
    const errors: string[] = []
    expect(main(root, (line) => errors.push(line))).not.toBe(0)
    expect(errors.join('\n')).toContain('assets/icons-abc.js')
  })

  it('échoue quand le manifeste est vide', () => {
    const root = makeDist({ 'sw.js': 'rien', 'index.html': '' })
    const errors: string[] = []
    expect(main(root, (line) => errors.push(line))).not.toBe(0)
    expect(errors.join('\n')).toContain('vide')
  })

  it('réussit quand tout est pré-caché', () => {
    const root = makeDist({
      'sw.js': swWith('index.html', 'assets/a.js'),
      'index.html': '',
      'assets/a.js': '',
    })
    expect(main(root, () => undefined)).toBe(0)
  })
})

it('ignore le dossier docs/ de premier niveau', () => {
  const root = makeDist({ 'index.html': '', 'docs/index.html': '', 'docs/assets/a.js': '' })
  expect(listDistFiles(root)).toEqual(['index.html'])
})

describe('findDocsEntries', () => {
  it('nomme les entrées de la doc', () => {
    expect(findDocsEntries(['index.html', 'docs/index.html'])).toEqual(['docs/index.html'])
  })
})

it('main échoue si la doc est pré-cachée', () => {
  const root = makeDist({ 'sw.js': swWith('index.html', 'docs/index.html'), 'index.html': '' })
  const errors: string[] = []
  expect(main(root, (line) => errors.push(line))).not.toBe(0)
  expect(errors.join('\n')).toContain('docs/index.html')
})

it('main passe quand la doc est dans dist mais hors pré-cache', () => {
  const root = makeDist({ 'sw.js': swWith('index.html'), 'index.html': '', 'docs/index.html': '' })
  expect(main(root, () => {})).toBe(0)
})
