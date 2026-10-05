import { useRef, useState } from 'react'
import type { NormalizedConfig } from '@/domain/config/normalize'
import type { ValidationResult } from '@/domain/config/validate'
import { newTraining } from '@/domain/training/new-training'
import type { FileSlot } from '@/components/file-slot'
import { useConfigSlot } from '@/hooks/use-config-slot'
import { stashConfigForEditor } from '@/lib/config-handoff'
import type { DbStatus } from '@/lib/db/db'
import { requestPersistentStorage } from '@/lib/db/persistence'
import { createTraining } from '@/lib/db/trainings'

/** Nom donné au JSON collé : affiché comme un nom de fichier, repris par l'éditeur. */
export const PASTED_FILE_NAME = 'config-collee.json'

export type TrainingSetup = {
  config: FileSlot<ValidationResult>
  pasted: string
  submitting: boolean
  submitError: boolean
  canSubmit: boolean
  /** La config chargée est invalide : elle peut être reprise dans l'éditeur. */
  canFix: boolean
  setConfigFile: (file: File) => Promise<void>
  setPasted: (text: string) => void
  /** Valide le JSON collé (au clic, pas à la frappe). Sans effet si la zone est vide. */
  checkPasted: () => Promise<void>
  /** Dépose la config chargée pour l'éditeur ; `false` si son texte n'a pas pu être relu. */
  fixInEditor: () => Promise<boolean>
  /** Id de l'entraînement créé ; `undefined` si refus (config invalide, déjà en cours) ou échec. */
  submit: () => Promise<string | undefined>
}

/** Source de la config chargée : de quoi la relire pour la passer à l'éditeur. */
type Source = { fileName: string; read: () => Promise<string> }

/**
 * État de l'écran de mise en place (F43.3) : config déposée ou collée, validée par le validateur
 * chargé à la demande, reprise dans l'éditeur si invalide, création de l'entraînement.
 */
export function useTrainingSetup(dbStatus: DbStatus): TrainingSetup {
  const { slot: config, ...configSlot } = useConfigSlot()
  const [pasted, setPasted] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(false)
  // Dernière source chargée : le dernier dépôt ou collage l'emporte, comme dans l'emplacement.
  const source = useRef<Source | undefined>(undefined)
  // Garde synchrone : deux clics dans le même tick voient la même valeur de `submitting`.
  const submitLock = useRef(false)

  const loaded = config.kind === 'loaded' ? config.result : undefined
  const validConfig: NormalizedConfig | null = loaded?.ok === true ? loaded.config : null
  const canSubmit = validConfig !== null && dbStatus === 'open' && !submitting

  async function setConfigFile(file: File): Promise<void> {
    source.current = { fileName: file.name, read: () => file.text() }
    await configSlot.setConfigFile(file)
  }

  async function checkPasted(): Promise<void> {
    const text = pasted
    if (text.trim() === '') return
    source.current = { fileName: PASTED_FILE_NAME, read: () => Promise.resolve(text) }
    await configSlot.setConfigText(text, PASTED_FILE_NAME)
  }

  async function fixInEditor(): Promise<boolean> {
    const current = source.current
    if (current === undefined) return false
    try {
      stashConfigForEditor({ text: await current.read(), fileName: current.fileName })
      return true
    } catch {
      return false
    }
  }

  async function submit(): Promise<string | undefined> {
    if (!canSubmit || submitLock.current || validConfig === null) return undefined
    submitLock.current = true
    setSubmitting(true)
    setSubmitError(false)
    try {
      // Un refus ou une erreur du navigateur ne bloque pas la création (F05 avertira).
      await requestPersistentStorage().catch(() => false)
      const training = newTraining(validConfig, {
        newId: () => crypto.randomUUID(),
        now: () => new Date(),
      })
      await createTraining(training)
      // `submitting` reste vrai : la page navigue vers l'entraînement.
      return training.id
    } catch {
      submitLock.current = false
      setSubmitError(true)
      setSubmitting(false)
      return undefined
    }
  }

  return {
    config,
    pasted,
    submitting,
    submitError,
    canSubmit,
    canFix: loaded?.ok === false,
    setConfigFile,
    setPasted,
    checkPasted,
    fixInEditor,
    submit,
  }
}
