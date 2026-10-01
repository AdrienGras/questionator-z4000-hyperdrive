import { useEffect, useState } from 'react'

import type { NormalizedConfig } from '@/domain/config/normalize'
import type { ValidationResult } from '@/domain/config/validate'

const VALIDATION_DELAY_MS = 300

const cssSupports = (property: string, value: string) => CSS.supports(property, value)

/**
 * Validation différée (300 ms) du texte de l'éditeur. `validate` est importé à la demande ;
 * `lastValid` garde la dernière config valide tant que le texte courant est invalide. Si le
 * module ne se charge pas (chunk introuvable après un déploiement, hors ligne), `loadError`
 * passe à vrai et `pending` retombe : rien n'attend plus une validation qui ne viendra pas. Le
 * prochain changement de texte retente l'import.
 */
export function useLiveValidation(text: string): {
  result: ValidationResult | undefined
  lastValid: NormalizedConfig | undefined
  pending: boolean
  /** Texte auquel `result` correspond (les positions de ses issues s'y rapportent). */
  validatedText: string | undefined
  /** Le dernier import du validateur a échoué. */
  loadError: boolean
} {
  const [state, setState] = useState<{
    result: ValidationResult | undefined
    lastValid: NormalizedConfig | undefined
    validatedText: string | undefined
    /** Texte dont la validation n'a pas pu avoir lieu (import en échec). */
    failedText: string | undefined
  }>({ result: undefined, lastValid: undefined, validatedText: undefined, failedText: undefined })

  useEffect(() => {
    let cancelled = false
    const timer = setTimeout(() => {
      void import('@/domain/config/validate').then(
        ({ validateConfig }) => {
          if (cancelled) return
          const result = validateConfig(text, { cssSupports })
          setState((previous) => ({
            result,
            lastValid: result.ok ? result.config : previous.lastValid,
            validatedText: text,
            failedText: undefined,
          }))
        },
        () => {
          if (cancelled) return
          setState((previous) => ({ ...previous, failedText: text }))
        },
      )
    }, VALIDATION_DELAY_MS)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [text])

  const loadError = state.failedText !== undefined
  return {
    result: state.result,
    lastValid: state.lastValid,
    pending: state.validatedText !== text && state.failedText !== text,
    validatedText: state.validatedText,
    loadError,
  }
}
