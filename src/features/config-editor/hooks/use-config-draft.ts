import { useCallback, useEffect, useRef, useState } from 'react'

import { takeConfigForEditor } from '@/lib/config-handoff'

import exampleText from '../../../../examples/config.example.json?raw'

/** Texte de l'exemple livré (`examples/config.example.json`), point de départ sans brouillon. */
export const EXAMPLE_TEXT: string = exampleText

export const DRAFT_KEY = 'questionator:config-draft'
const SAVE_DELAY_MS = 300

/**
 * Texte de départ : une config déposée pour l'éditeur prime sur le brouillon et le remplace
 * aussitôt (écriture immédiate). Le dépôt est consommé à la lecture ; comme le nouveau brouillon
 * porte le même texte, le second appel de l'initialiseur sous StrictMode retrouve la même valeur.
 */
function readDraft(): string {
  const handoff = takeConfigForEditor()
  if (handoff !== undefined) {
    writeDraft(handoff.text)
    return handoff.text
  }
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
 * l'écriture en attente est vidangée au démontage et sur `pagehide`.
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

  // `pagehide` : onglet fermé ou rechargé avant la fin du délai, le démontage n'a pas lieu.
  useEffect(() => {
    globalThis.addEventListener('pagehide', flush)
    return () => {
      globalThis.removeEventListener('pagehide', flush)
      flush()
    }
  }, [flush])

  return { initialText, save }
}
