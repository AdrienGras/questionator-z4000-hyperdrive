import { useRef, useState } from 'react'
import type { ValidationResult } from '@/domain/config/validate'
import { createSession } from '@/lib/db/sessions'
import { requestPersistentStorage } from '@/lib/db/persistence'
import { type DbStatus } from '@/lib/db/db'
import type { Locale } from '@/lib/i18n/i18n'
import { buildSession } from '@/domain/session/build-session'
import { csvWarning } from '@/domain/students/issues'
import { decodeCsvBytes } from '@/domain/students/decode'
import { parseStudentsCsv, type CsvParseResult } from '@/domain/students/parse-csv'
import { defaultSessionName } from '@/features/create-session/default-session-name'

export type FileSlot<T> =
  | { kind: 'empty' }
  | { kind: 'reading'; fileName: string }
  | { kind: 'read-error'; fileName: string }
  | { kind: 'load-error'; fileName: string } // config : échec du chargement du validateur
  | { kind: 'loaded'; fileName: string; result: T }

export type CreateForm = {
  students: FileSlot<CsvParseResult>
  config: FileSlot<ValidationResult>
  name: string
  examiner: string
  submitting: boolean
  submitError: boolean
  canSubmit: boolean
  setStudentsFile: (file: File) => Promise<void>
  setConfigFile: (file: File) => Promise<void>
  /** Saisie utilisateur : arrête le préremplissage du nom. */
  setName: (value: string) => void
  setExaminer: (value: string) => void
  /** Id de la session créée ; `undefined` si refus (formulaire incomplet, déjà en cours) ou échec. */
  submit: () => Promise<string | undefined>
}

/** Appel paresseux : `CSS` n'est lu qu'au moment de la validation (absent de jsdom). */
const cssSupports = (property: string, value: string) => CSS.supports(property, value)

/**
 * Validateur chargé à la demande (~200 kB avec les noms d'icônes) : il ne doit pas alourdir le
 * chunk de l'écran de création tant qu'aucune config n'est déposée.
 */
async function loadValidator() {
  const { validateConfig } = await import('@/domain/config/validate')
  return validateConfig
}

async function readText(file: File): Promise<string | undefined> {
  try {
    return await file.text()
  } catch {
    return undefined
  }
}

/**
 * Lit et décode un CSV déposé (D58) : octets bruts, jamais `file.text()` qui forcerait l'UTF-8 et
 * corromprait un export Excel FR (Windows-1252). Un avertissement `legacy_encoding` est ajouté en
 * tête des issues quand le repli Windows-1252 a été nécessaire.
 */
async function readStudentsCsv(file: File): Promise<CsvParseResult | undefined> {
  let bytes: ArrayBuffer
  try {
    bytes = await file.arrayBuffer()
  } catch {
    return undefined
  }
  const { text, encoding } = decodeCsvBytes(bytes)
  const result = parseStudentsCsv(text)
  if (encoding === 'utf-8') return result
  return { ...result, issues: [csvWarning('legacy_encoding', {}), ...result.issues] }
}

/**
 * État du formulaire de création (F06) : lecture et validation des deux fichiers, nom prérempli
 * depuis la config tant que l'utilisateur ne l'a pas saisi, création de la session.
 */
export function useCreateForm(locale: Locale, dbStatus: DbStatus): CreateForm {
  const [students, setStudents] = useState<FileSlot<CsvParseResult>>({ kind: 'empty' })
  const [config, setConfig] = useState<FileSlot<ValidationResult>>({ kind: 'empty' })
  const [name, setName] = useState('')
  const [examiner, setExaminer] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(false)
  // Lus après un `await` : des refs, pour ne pas dépendre de la fermeture d'un rendu passé.
  const nameEdited = useRef(false)
  const studentsSeq = useRef(0)
  const configSeq = useRef(0)
  // Garde synchrone : deux clics dans le même tick voient la même valeur de `submitting`.
  const submitLock = useRef(false)

  const studentsOk =
    students.kind === 'loaded' && !students.result.issues.some((i) => i.severity === 'error')
  const validConfig = config.kind === 'loaded' && config.result.ok ? config.result.config : null
  const canSubmit =
    studentsOk && validConfig !== null && name.trim() !== '' && dbStatus === 'open' && !submitting

  async function setStudentsFile(file: File): Promise<void> {
    // Un fichier déposé plus tard dans le même emplacement rend celui-ci obsolète.
    const seq = ++studentsSeq.current
    const fileName = file.name
    setStudents({ kind: 'reading', fileName })
    const result = await readStudentsCsv(file)
    if (seq !== studentsSeq.current) return
    if (result === undefined) {
      setStudents({ kind: 'read-error', fileName })
      return
    }
    setStudents({ kind: 'loaded', fileName, result })
  }

  async function setConfigFile(file: File): Promise<void> {
    const seq = ++configSeq.current
    const fileName = file.name
    setConfig({ kind: 'reading', fileName })
    const text = await readText(file)
    if (seq !== configSeq.current) return
    if (text === undefined) {
      setConfig({ kind: 'read-error', fileName })
      return
    }
    let validateConfig: Awaited<ReturnType<typeof loadValidator>>
    try {
      validateConfig = await loadValidator()
    } catch {
      if (seq === configSeq.current) setConfig({ kind: 'load-error', fileName })
      return
    }
    if (seq !== configSeq.current) return
    const result = validateConfig(text, { cssSupports })
    setConfig({ kind: 'loaded', fileName, result })
    if (result.ok && !nameEdited.current) {
      setName(defaultSessionName(result.config.exam.title, new Date(), locale))
    }
  }

  function editName(value: string) {
    nameEdited.current = true
    setName(value)
  }

  async function submit(): Promise<string | undefined> {
    if (!canSubmit || submitLock.current || students.kind !== 'loaded' || validConfig === null) {
      return undefined
    }
    submitLock.current = true
    setSubmitting(true)
    setSubmitError(false)
    try {
      // Un refus ou une erreur du navigateur ne bloque pas la création (F05 avertira).
      await requestPersistentStorage().catch(() => false)
      const session = buildSession(
        { name, examiner, config: validConfig, students: students.result.students },
        { newId: () => crypto.randomUUID(), now: () => new Date() },
      )
      await createSession(session)
      // `submitting` reste vrai : la page navigue vers la session.
      return session.id
    } catch {
      submitLock.current = false
      setSubmitError(true)
      setSubmitting(false)
      return undefined
    }
  }

  return {
    students,
    config,
    name,
    examiner,
    submitting,
    submitError,
    canSubmit,
    setStudentsFile,
    setConfigFile,
    setName: editName,
    setExaminer,
    submit,
  }
}
