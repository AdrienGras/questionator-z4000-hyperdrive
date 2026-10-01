import { useEffect, useState } from 'react'

import type { NormalizedConfig } from '@/domain/config/normalize'
import type { ValidationResult } from '@/domain/config/validate'

const VALIDATION_DELAY_MS = 300

const cssSupports = (property: string, value: string) => CSS.supports(property, value)

/**
 * Validation différée (300 ms) du texte de l'éditeur. `validate` est importé à la demande ;
 * `lastValid` garde la dernière config valide tant que le texte courant est invalide.
 */
export function useLiveValidation(text: string): {
  result: ValidationResult | undefined
  lastValid: NormalizedConfig | undefined
  pending: boolean
} {
  const [state, setState] = useState<{
    result: ValidationResult | undefined
    lastValid: NormalizedConfig | undefined
    validatedText: string | undefined
  }>({ result: undefined, lastValid: undefined, validatedText: undefined })

  useEffect(() => {
    let cancelled = false
    const timer = setTimeout(() => {
      void import('@/domain/config/validate').then(({ validateConfig }) => {
        if (cancelled) return
        const result = validateConfig(text, { cssSupports })
        setState((previous) => ({
          result,
          lastValid: result.ok ? result.config : previous.lastValid,
          validatedText: text,
        }))
      })
    }, VALIDATION_DELAY_MS)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [text])

  return {
    result: state.result,
    lastValid: state.lastValid,
    pending: state.validatedText !== text,
  }
}
