import 'fake-indexeddb/auto'
import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { validateConfig } from '@/domain/config/validate'
import { getSession } from '@/lib/db/sessions'
import { db, type DbStatus } from '@/lib/db/db'
import { minimalConfig } from '@/testing/config-fixtures'
import { useCreateForm } from './use-create-form'

const dbMock = vi.hoisted(() => ({ failCreate: false, failPersist: false }))
const validatorLoad = vi.hoisted(() => ({ fail: false }))

vi.mock('@/lib/db/sessions', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/db/sessions')>()
  return {
    ...actual,
    createSession: (session: Parameters<typeof actual.createSession>[0]) =>
      dbMock.failCreate ? Promise.reject(new Error('écriture')) : actual.createSession(session),
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

// Simule l'échec du chargement dynamique du validateur (chunk introuvable après un déploiement).
vi.mock('@/domain/config/validate', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/domain/config/validate')>()
  return {
    ...actual,
    get validateConfig() {
      if (validatorLoad.fail) throw new Error('chargement impossible')
      return actual.validateConfig
    },
  }
})

const CSV = 'Nom;Prénom\nDurand;Alice\nMartin;Bruno\n'
/** Deux avertissements (doublon), aucune erreur. */
const CSV_WARNINGS = 'Nom;Prénom\nDurand;Alice\nDurand;Alice\n'
const CSV_EMPTY = 'Nom;Prénom\n'

function csvFile(text = CSV): File {
  return new File([text], 'etudiants.csv', { type: 'text/csv' })
}

function configFile(title = 'Oral de test'): File {
  const config = minimalConfig()
  config.exam.title = title
  return new File([JSON.stringify(config)], 'config.json', { type: 'application/json' })
}

function invalidConfigFile(): File {
  return new File(['{}'], 'invalide.json', { type: 'application/json' })
}

function unreadableFile(name: string): File {
  const file = new File([''], name)
  vi.spyOn(file, 'text').mockRejectedValue(new Error('lecture'))
  vi.spyOn(file, 'arrayBuffer').mockRejectedValue(new Error('lecture'))
  return file
}

/** Convertit une chaîne dont chaque caractère est déjà un code d'octet (0-255) en octets. */
function toBytes(latin1: string): Uint8Array<ArrayBuffer> {
  return new Uint8Array(Array.from(latin1, (char) => char.charCodeAt(0)))
}

/** CSV encodé en Windows-1252 (export Excel FR historique, D58), pas en UTF-8. */
function windows1252CsvFile(): File {
  const bytes = toBytes('Nom;Pr\xe9nom\r\nLef\xe8vre;Chlo\xe9\r\n')
  return new File([bytes], 'etudiants.csv', { type: 'text/csv' })
}

/** Lecture d'octets en suspens (CSV, lu via `arrayBuffer`), libérée à la main. */
function deferredArrayBuffer() {
  let settle: ((buffer: ArrayBuffer) => void) | undefined
  const promise = new Promise<ArrayBuffer>((resolve) => {
    settle = resolve
  })
  return {
    promise,
    release: (text: string) => settle?.(new TextEncoder().encode(text).buffer),
  }
}

function renderForm(status: DbStatus = 'open') {
  return renderHook(({ dbStatus }) => useCreateForm('fr', dbStatus), {
    initialProps: { dbStatus: status },
  })
}

type Form = ReturnType<typeof renderForm>['result']

async function loadValid(result: Form, csv = CSV) {
  await act(() => result.current.setStudentsFile(csvFile(csv)))
  await act(() => result.current.setConfigFile(configFile()))
}

beforeEach(async () => {
  await db.sessions.clear()
  vi.stubGlobal('CSS', { supports: () => true })
})

afterEach(() => {
  dbMock.failCreate = false
  dbMock.failPersist = false
  validatorLoad.fail = false
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('useCreateForm', () => {
  test('état initial : deux emplacements vides, création impossible', () => {
    const { result } = renderForm()
    expect(result.current.students).toEqual({ kind: 'empty' })
    expect(result.current.config).toEqual({ kind: 'empty' })
    expect(result.current.name).toBe('')
    expect(result.current.canSubmit).toBe(false)
  })

  test('CSV avec avertissements seuls et config valide → création possible', async () => {
    const { result } = renderForm()
    await loadValid(result, CSV_WARNINGS)
    const students = result.current.students
    if (students.kind !== 'loaded') throw new Error('CSV non chargé')
    expect(students.fileName).toBe('etudiants.csv')
    expect(students.result.issues.length).toBeGreaterThan(0)
    expect(result.current.canSubmit).toBe(true)
  })

  test('CSV en Windows-1252 (export Excel FR) : noms corrects, avertissement legacy_encoding', async () => {
    const { result } = renderForm()
    await act(() => result.current.setStudentsFile(windows1252CsvFile()))
    const students = result.current.students
    if (students.kind !== 'loaded') throw new Error('CSV non chargé')
    expect(students.result.students).toEqual([{ lastName: 'Lefèvre', firstName: 'Chloé', line: 2 }])
    expect(students.result.issues).toEqual([
      { severity: 'warning', code: 'legacy_encoding', params: {} },
    ])
  })

  test('CSV sans étudiant → création impossible', async () => {
    const { result } = renderForm()
    await loadValid(result, CSV_EMPTY)
    expect(result.current.students.kind).toBe('loaded')
    expect(result.current.canSubmit).toBe(false)
  })

  test('config invalide → création impossible', async () => {
    const { result } = renderForm()
    await act(() => result.current.setStudentsFile(csvFile()))
    await act(() => result.current.setConfigFile(invalidConfigFile()))
    const config = result.current.config
    if (config.kind !== 'loaded') throw new Error('config non chargée')
    expect(config.result.ok).toBe(false)
    expect(result.current.canSubmit).toBe(false)
  })

  test("nom prérempli au chargement d'une config valide", async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-09-25T10:00:00'))
    const { result } = renderForm()
    await act(() => result.current.setConfigFile(configFile()))
    expect(result.current.name).toBe('Oral de test — 25 septembre 2026')
  })

  test('un nom saisi à la main n’est plus écrasé par une autre config', async () => {
    const { result } = renderForm()
    await act(() => result.current.setConfigFile(configFile()))
    act(() => result.current.setName('Mon oral'))
    await act(() => result.current.setConfigFile(configFile('Autre oral')))
    expect(result.current.name).toBe('Mon oral')
  })

  test('un nom vidé à la main reste vide après une config valide', async () => {
    const { result } = renderForm()
    act(() => result.current.setName(''))
    await act(() => result.current.setConfigFile(configFile()))
    expect(result.current.name).toBe('')
    expect(result.current.canSubmit).toBe(false)
  })

  test('config valide remplacée par une invalide : nom conservé, création impossible', async () => {
    const { result } = renderForm()
    await loadValid(result)
    const prefilled = result.current.name
    expect(prefilled.startsWith('Oral de test — ')).toBe(true)
    await act(() => result.current.setConfigFile(invalidConfigFile()))
    expect(result.current.name).toBe(prefilled)
    expect(result.current.canSubmit).toBe(false)
  })

  test('base non ouverte → création impossible', async () => {
    const { result, rerender } = renderForm()
    await loadValid(result)
    expect(result.current.canSubmit).toBe(true)
    rerender({ dbStatus: 'outdated' })
    expect(result.current.canSubmit).toBe(false)
  })

  test('seul le dernier fichier déposé compte si le premier répond en retard', async () => {
    const { result } = renderForm()
    const slow = csvFile(CSV_EMPTY)
    const { promise, release } = deferredArrayBuffer()
    vi.spyOn(slow, 'arrayBuffer').mockReturnValue(promise)
    let first: Promise<void> = Promise.resolve()
    act(() => {
      first = result.current.setStudentsFile(slow)
    })
    await act(() => result.current.setStudentsFile(csvFile()))
    await act(async () => {
      release(CSV_EMPTY)
      await first
    })
    const students = result.current.students
    if (students.kind !== 'loaded') throw new Error('CSV non chargé')
    expect(students.result.students).toHaveLength(2)
  })

  test('submit crée la session et renvoie son id', async () => {
    const { result } = renderForm()
    await loadValid(result)
    act(() => result.current.setName('  Oral PHP  '))
    act(() => result.current.setExaminer(' M. Dupont '))
    let id: string | undefined
    await act(async () => {
      id = await result.current.submit()
    })
    if (id === undefined) throw new Error('aucune session créée')
    const session = await getSession(id)
    expect(session?.name).toBe('Oral PHP')
    expect(session?.examiner).toBe('M. Dupont')
    const expected = validateConfig(JSON.stringify(minimalConfig()), { cssSupports: () => true })
    if (!expected.ok) throw new Error('config de test invalide')
    expect(session?.config).toStrictEqual(expected.config)
    expect(session?.students.map((s) => `${s.lastName} ${s.firstName}`)).toEqual([
      'Durand Alice',
      'Martin Bruno',
    ])
    expect(session?.activeStudentId).toBe(session?.students[0]?.id)
    expect(result.current.submitting).toBe(true)
  })

  test('double appel de submit sans attendre → une seule session', async () => {
    const { result } = renderForm()
    await loadValid(result)
    let ids: (string | undefined)[] = []
    await act(async () => {
      ids = await Promise.all([result.current.submit(), result.current.submit()])
    })
    expect(ids.filter((id) => id !== undefined)).toHaveLength(1)
    expect(await db.sessions.count()).toBe(1)
  })

  test('submit refusé si le formulaire est incomplet', async () => {
    const { result } = renderForm()
    await act(() => result.current.setStudentsFile(csvFile()))
    let id: string | undefined = 'x'
    await act(async () => {
      id = await result.current.submit()
    })
    expect(id).toBeUndefined()
    expect(await db.sessions.count()).toBe(0)
  })

  test("échec de l'écriture → submitError, formulaire conservé", async () => {
    dbMock.failCreate = true
    const { result } = renderForm()
    await loadValid(result)
    const name = result.current.name
    let id: string | undefined = 'x'
    await act(async () => {
      id = await result.current.submit()
    })
    expect(id).toBeUndefined()
    expect(result.current.submitError).toBe(true)
    expect(result.current.submitting).toBe(false)
    expect(result.current.name).toBe(name)
    expect(result.current.students.kind).toBe('loaded')
    expect(result.current.canSubmit).toBe(true)
  })

  test('stockage persistant en échec → la session est quand même créée', async () => {
    dbMock.failPersist = true
    const { result } = renderForm()
    await loadValid(result)
    let id: string | undefined
    await act(async () => {
      id = await result.current.submit()
    })
    expect(id).toBeDefined()
    expect(await db.sessions.count()).toBe(1)
  })

  test('lecture de fichier en échec → read-error', async () => {
    const { result } = renderForm()
    await act(() => result.current.setStudentsFile(unreadableFile('x.csv')))
    await act(() => result.current.setConfigFile(unreadableFile('x.json')))
    expect(result.current.students).toEqual({ kind: 'read-error', fileName: 'x.csv' })
    expect(result.current.config).toEqual({ kind: 'read-error', fileName: 'x.json' })
  })

  test('validateur impossible à charger → load-error', async () => {
    validatorLoad.fail = true
    const { result } = renderForm()
    await act(() => result.current.setConfigFile(configFile()))
    expect(result.current.config).toEqual({ kind: 'load-error', fileName: 'config.json' })
  })

  test('état reading pendant la lecture', async () => {
    const { result } = renderForm()
    const slow = csvFile()
    const { promise, release } = deferredArrayBuffer()
    vi.spyOn(slow, 'arrayBuffer').mockReturnValue(promise)
    let pending: Promise<void> = Promise.resolve()
    act(() => {
      pending = result.current.setStudentsFile(slow)
    })
    expect(result.current.students).toEqual({ kind: 'reading', fileName: 'etudiants.csv' })
    await act(async () => {
      release(CSV)
      await pending
    })
    await waitFor(() => expect(result.current.students.kind).toBe('loaded'))
  })
})
