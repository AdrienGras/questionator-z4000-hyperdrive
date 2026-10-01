import { useCallback, useEffect, useRef, useState } from 'react'

import exampleText from '../../../../examples/config.example.json?raw'

/** Texte de l'exemple livré (`examples/config.example.json`), point de départ sans brouillon. */
export const EXAMPLE_TEXT: string = exampleText

export const DRAFT_KEY = 'questionator:config-draft'
const SAVE_DELAY_MS = 300

function readDraft(): string {
  try {
    return localStorage.getItem(DRAFT_KEY) ?? exampleText
  } catch {
    return exampleText
  }
}

function writeDraft(text: string): void {
  try {
    localStorage.setItem(DRAFT_KEY, text)
  } catch {
    // Stockage indisponible ou plein : le brouillon est un confort, on ignore.
  }
}

/**
 * Brouillon de l'éditeur dans `localStorage`. Lu une seule fois (premier rendu) ; sans
 * brouillon, on part de l'exemple livré. `save` est différé de 300 ms (dernière valeur) et
 * l'écriture en attente est vidangée au démontage.
 */
export function useConfigDraft(): { initialText: string; save: (text: string) => void } {
  const [initialText] = useState(readDraft)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const pendingText = useRef<string | undefined>(undefined)

  const flush = useCallback(() => {
    clearTimeout(timer.current)
    timer.current = undefined
    if (pendingText.current !== undefined) writeDraft(pendingText.current)
    pendingText.current = undefined
  }, [])

  const save = useCallback(
    (text: string) => {
      pendingText.current = text
      clearTimeout(timer.current)
      timer.current = setTimeout(flush, SAVE_DELAY_MS)
    },
    [flush],
  )

  useEffect(() => flush, [flush])

  return { initialText, save }
}
