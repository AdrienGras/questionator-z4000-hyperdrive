import { useRef, useState } from 'react'
import type { ValidationResult } from '@/domain/config/validate'
import type { FileSlot } from '@/components/file-slot'

export type ConfigSlot = {
  slot: FileSlot<ValidationResult>
  /**
   * Lit et valide une config déposée. Résout sur le résultat de la validation, ou `undefined` si
   * la lecture ou le chargement du validateur a échoué, ou si un dépôt plus récent l'a rendue
   * obsolète.
   */
  setConfigFile: (file: File) => Promise<ValidationResult | undefined>
  /** Même chemin que `setConfigFile` pour un texte déjà en main (passage depuis l'éditeur). */
  setConfigText: (text: string, fileName: string) => Promise<ValidationResult | undefined>
  /** Vide l'emplacement ; une lecture ou une validation en vol devient obsolète. */
  clear: () => void
}

/** Appel paresseux : `CSS` n'est lu qu'au moment de la validation (absent de jsdom). */
const cssSupports = (property: string, value: string) => CSS.supports(property, value)

/**
 * Validateur chargé à la demande (~200 kB avec les noms d'icônes) : il ne doit pas alourdir le
 * chunk de l'écran appelant tant qu'aucune config n'est déposée. Le catalogue des langages
 * (`shiki/langs`) aussi : il active l'avertissement `unknown_code_language` (F18).
 */
async function loadValidator(): Promise<(text: string) => ValidationResult> {
  const [{ validateConfig }, { isKnownLanguage }] = await Promise.all([
    import('@/domain/config/validate'),
    import('@/domain/config/code-languages'),
  ])
  return (text) => validateConfig(text, { cssSupports, isKnownLanguage })
}

async function readText(file: File): Promise<string | undefined> {
  try {
    return await file.text()
  } catch {
    return undefined
  }
}

/**
 * Emplacement d'une config JSON déposée ou collée : lecture, validation par le validateur chargé
 * à la demande, garde de séquence (un dépôt plus récent rend les résultats en vol obsolètes).
 */
export function useConfigSlot(): ConfigSlot {
  const [slot, setSlot] = useState<FileSlot<ValidationResult>>({ kind: 'empty' })
  // Lu après un `await` : une ref, pour ne pas dépendre de la fermeture d'un rendu passé.
  const seqRef = useRef(0)

  async function setConfigFile(file: File): Promise<ValidationResult | undefined> {
    // Un fichier déposé plus tard dans le même emplacement rend celui-ci obsolète.
    const seq = ++seqRef.current
    const fileName = file.name
    setSlot({ kind: 'reading', fileName })
    const text = await readText(file)
    if (seq !== seqRef.current) return undefined
    if (text === undefined) {
      setSlot({ kind: 'read-error', fileName })
      return undefined
    }
    return validateText(text, fileName, seq)
  }

  async function setConfigText(
    text: string,
    fileName: string,
  ): Promise<ValidationResult | undefined> {
    const seq = ++seqRef.current
    setSlot({ kind: 'reading', fileName })
    return validateText(text, fileName, seq)
  }

  async function validateText(
    text: string,
    fileName: string,
    seq: number,
  ): Promise<ValidationResult | undefined> {
    let validateConfig: Awaited<ReturnType<typeof loadValidator>>
    try {
      validateConfig = await loadValidator()
    } catch {
      if (seq === seqRef.current) setSlot({ kind: 'load-error', fileName })
      return undefined
    }
    if (seq !== seqRef.current) return undefined
    const result = validateConfig(text)
    setSlot({ kind: 'loaded', fileName, result })
    return result
  }

  function clear(): void {
    seqRef.current++
    setSlot({ kind: 'empty' })
  }

  return { slot, setConfigFile, setConfigText, clear }
}
