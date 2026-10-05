import { afterEach, describe, expect, test, vi } from 'vitest'
import {
  stashConfigForCreation,
  stashConfigForEditor,
  takeConfigForCreation,
  takeConfigForEditor,
} from './config-handoff'

afterEach(() => {
  vi.restoreAllMocks()
  sessionStorage.clear()
})

describe('config-handoff', () => {
  test('stash puis take rend l’objet, un second take rien', () => {
    stashConfigForCreation({ text: '{"a":1}', fileName: 'config.json' })
    expect(takeConfigForCreation()).toEqual({ text: '{"a":1}', fileName: 'config.json' })
    expect(takeConfigForCreation()).toBeUndefined()
  })

  test('contenu illisible : undefined', () => {
    sessionStorage.setItem('questionator:config-handoff', '{pas du json')
    expect(takeConfigForCreation()).toBeUndefined()
    sessionStorage.setItem('questionator:config-handoff', '{"text":1}')
    expect(takeConfigForCreation()).toBeUndefined()
  })

  test('sessionStorage qui lève : undefined, sans exception', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('indisponible')
    })
    expect(takeConfigForCreation()).toBeUndefined()
  })

  test('stash tolère un stockage qui lève', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('plein')
    })
    expect(() => stashConfigForCreation({ text: 'x', fileName: 'y' })).not.toThrow()
  })
})

describe('config-handoff vers l’éditeur', () => {
  test('stash puis take rend l’objet, un second take rien', () => {
    stashConfigForEditor({ text: '{"a":1}', fileName: 'config.json' })
    expect(takeConfigForEditor()).toEqual({ text: '{"a":1}', fileName: 'config.json' })
    expect(takeConfigForEditor()).toBeUndefined()
  })

  test('indépendant du dépôt vers la création', () => {
    stashConfigForEditor({ text: 'e', fileName: 'e.json' })
    expect(takeConfigForCreation()).toBeUndefined()
    expect(takeConfigForEditor()).toEqual({ text: 'e', fileName: 'e.json' })
  })

  test('contenu illisible : undefined', () => {
    sessionStorage.setItem('questionator:editor-handoff', '{pas du json')
    expect(takeConfigForEditor()).toBeUndefined()
    sessionStorage.setItem('questionator:editor-handoff', '{"text":1}')
    expect(takeConfigForEditor()).toBeUndefined()
  })

  test('sessionStorage qui lève : undefined, sans exception', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('indisponible')
    })
    expect(takeConfigForEditor()).toBeUndefined()
  })

  test('stash tolère un stockage qui lève', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('plein')
    })
    expect(() => stashConfigForEditor({ text: 'x', fileName: 'y' })).not.toThrow()
  })
})
