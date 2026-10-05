import 'fake-indexeddb/auto'
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { db, type DbStatus } from '@/lib/db/db'
import { takeConfigForEditor } from '@/lib/config-handoff'
import { minimalConfig } from '@/testing/config-fixtures'
import { useTrainingSetup } from './use-training-setup'

const dbMock = vi.hoisted(() => ({ failCreate: false, failPersist: false }))

vi.mock('@/lib/db/trainings', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/db/trainings')>()
  return {
    ...actual,
    createTraining: (training: Parameters<typeof actual.createTraining>[0]) =>
      dbMock.failCreate ? Promise.reject(new Error('écriture')) : actual.createTraining(training),
  }
})
vi.mock('@/lib/db/persistence', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/db/persistence')>()
  return {
    ...actual,
    requestPersistentStorage: () =>
      dbMock.failPersist ? Promise.reject(new Error('refus')) : actual.requestPersistentStorage(),
  }
})

const VALID = JSON.stringify(minimalConfig())

function configFile(text = VALID, name = 'config.json'): File {
  return new File([text], name, { type: 'application/json' })
}

function renderSetup(dbStatus: DbStatus = 'open') {
  return renderHook(({ status }) => useTrainingSetup(status), {
    initialProps: { status: dbStatus },
  })
}

beforeEach(async () => {
  await db.trainings.clear()
  dbMock.failCreate = false
  dbMock.failPersist = false
  sessionStorage.clear()
  vi.stubGlobal('CSS', { supports: () => true })
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('useTrainingSetup', () => {
  test('état initial : rien à soumettre, aucune erreur', () => {
    const { result } = renderSetup()
    expect(result.current.config.kind).toBe('empty')
    expect(result.current.canSubmit).toBe(false)
    expect(result.current.canFix).toBe(false)
    expect(result.current.submitError).toBe(false)
  })

  test('fichier valide : soumission possible', async () => {
    const { result } = renderSetup()
    await act(() => result.current.setConfigFile(configFile()))
    expect(result.current.canSubmit).toBe(true)
    expect(result.current.canFix).toBe(false)
  })

  test('base non ouverte : soumission impossible même avec une config valide', async () => {
    const { result } = renderSetup('outdated')
    await act(() => result.current.setConfigFile(configFile()))
    expect(result.current.canSubmit).toBe(false)
    expect(await result.current.submit()).toBeUndefined()
  })

  test('texte collé : validé sous le nom config-collee.json', async () => {
    const { result } = renderSetup()
    act(() => result.current.setPasted(VALID))
    await act(() => result.current.checkPasted())
    expect(result.current.config).toMatchObject({ kind: 'loaded', fileName: 'config-collee.json' })
    expect(result.current.canSubmit).toBe(true)
  })

  test('texte collé vide : rien n’est validé', async () => {
    const { result } = renderSetup()
    act(() => result.current.setPasted('   '))
    await act(() => result.current.checkPasted())
    expect(result.current.config.kind).toBe('empty')
  })

  test('texte collé invalide : correction possible, passage du texte à l’éditeur', async () => {
    const { result } = renderSetup()
    act(() => result.current.setPasted('{}'))
    await act(() => result.current.checkPasted())
    expect(result.current.canSubmit).toBe(false)
    expect(result.current.canFix).toBe(true)
    await act(() => result.current.fixInEditor())
    expect(takeConfigForEditor()).toEqual({ text: '{}', fileName: 'config-collee.json' })
  })

  test('fichier invalide : son contenu est passé à l’éditeur', async () => {
    const { result } = renderSetup()
    await act(() => result.current.setConfigFile(configFile('{"a":1}', 'mauvais.json')))
    expect(result.current.canFix).toBe(true)
    await act(() => result.current.fixInEditor())
    expect(takeConfigForEditor()).toEqual({ text: '{"a":1}', fileName: 'mauvais.json' })
  })

  test('fichier illisible au moment de la correction : rien n’est passé, erreur signalée', async () => {
    const { result } = renderSetup()
    const file = configFile('{}', 'mauvais.json')
    await act(() => result.current.setConfigFile(file))
    vi.spyOn(file, 'text').mockRejectedValue(new Error('lecture'))
    let passed: boolean | undefined
    await act(async () => {
      passed = await result.current.fixInEditor()
    })
    expect(passed).toBe(false)
    expect(takeConfigForEditor()).toBeUndefined()
    expect(result.current.fixError).toBe(true)
  })

  test('nouvelle config après un échec de correction : l’erreur disparaît', async () => {
    const { result } = renderSetup()
    const file = configFile('{}', 'mauvais.json')
    await act(() => result.current.setConfigFile(file))
    vi.spyOn(file, 'text').mockRejectedValue(new Error('lecture'))
    await act(() => result.current.fixInEditor())
    await act(() => result.current.setConfigFile(configFile()))
    expect(result.current.fixError).toBe(false)
  })

  test('texte collé modifié après vérification : résultat périmé, rien à soumettre', async () => {
    const { result } = renderSetup()
    act(() => result.current.setPasted(VALID))
    await act(() => result.current.checkPasted())
    expect(result.current.canSubmit).toBe(true)
    act(() => result.current.setPasted(`${VALID} `))
    expect(result.current.config.kind).toBe('empty')
    expect(result.current.canSubmit).toBe(false)
    expect(result.current.canFix).toBe(false)
    await act(() => result.current.checkPasted())
    expect(result.current.canSubmit).toBe(true)
  })

  test('texte collé modifié alors que la config vient d’un fichier : le fichier reste', async () => {
    const { result } = renderSetup()
    await act(() => result.current.setConfigFile(configFile()))
    act(() => result.current.setPasted('brouillon'))
    expect(result.current.config).toMatchObject({ kind: 'loaded', fileName: 'config.json' })
    expect(result.current.canSubmit).toBe(true)
  })

  test('texte collé non parsable : issue listée, rien à soumettre', async () => {
    const { result } = renderSetup()
    act(() => result.current.setPasted('pas du json'))
    await act(() => result.current.checkPasted())
    const { config } = result.current
    expect(config.kind === 'loaded' && config.result.ok).toBe(false)
    expect(config.kind === 'loaded' && config.result.issues.length).toBeGreaterThan(0)
    expect(result.current.canSubmit).toBe(false)
    expect(result.current.canFix).toBe(true)
  })

  test('soumission : entraînement créé en base, nommé d’après l’examen', async () => {
    const { result } = renderSetup()
    await act(() => result.current.setConfigFile(configFile()))
    let id: string | undefined
    await act(async () => {
      id = await result.current.submit()
    })
    expect(id).toBeDefined()
    const stored = await db.trainings.get(id ?? '')
    expect(stored?.name).toBe('Oral de test')
    expect(result.current.submitting).toBe(true)
  })

  test('refus de la persistance : la création continue', async () => {
    dbMock.failPersist = true
    const { result } = renderSetup()
    await act(() => result.current.setConfigFile(configFile()))
    let id: string | undefined
    await act(async () => {
      id = await result.current.submit()
    })
    expect(id).toBeDefined()
  })

  test('échec de l’écriture : erreur affichée, nouvel essai possible', async () => {
    dbMock.failCreate = true
    const { result } = renderSetup()
    await act(() => result.current.setConfigFile(configFile()))
    let id: string | undefined
    await act(async () => {
      id = await result.current.submit()
    })
    expect(id).toBeUndefined()
    expect(result.current.submitError).toBe(true)
    expect(result.current.submitting).toBe(false)
    expect(result.current.canSubmit).toBe(true)
  })

  test('deux soumissions dans le même tick : une seule création', async () => {
    const { result } = renderSetup()
    await act(() => result.current.setConfigFile(configFile()))
    let ids: (string | undefined)[] = []
    await act(async () => {
      ids = await Promise.all([result.current.submit(), result.current.submit()])
    })
    expect(ids.filter((id) => id !== undefined)).toHaveLength(1)
    expect(await db.trainings.count()).toBe(1)
  })
})
