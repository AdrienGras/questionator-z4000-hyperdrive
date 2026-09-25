import { useState } from 'react'
import type { BackupIssue } from '@/domain/backup/issues'
import type { BackupParseResult } from '@/domain/backup/parse'
import { getSession, putSession } from '@/lib/db/sessions'
import type { Session } from '@/domain/session/types'

export type ImportState =
  | { kind: 'idle' }
  | { kind: 'error'; fileName: string; issues: BackupIssue[] }
  | { kind: 'read-error'; fileName: string }
  | { kind: 'load-error'; fileName: string }
  | { kind: 'conflict'; fileName: string; incoming: Session; existing: Session }
  | { kind: 'write-error'; fileName: string }

/** Appel paresseux : `CSS` n'est lu qu'au moment de la validation (absent de jsdom). */
const cssSupports = (property: string, value: string) => CSS.supports(property, value)

/**
 * Validateur chargé à la demande : il embarque toute la validation de config (schémas, noms
 * d'icônes), inutile tant qu'aucun import n'est lancé, et trop lourd pour le chunk de l'accueil.
 */
async function validateBackup(text: string): Promise<BackupParseResult> {
  const { parseBackup } = await import('@/domain/backup/parse')
  return parseBackup(text, { cssSupports })
}

/**
 * Machine d'états de l'import : lecture → validation → conflit d'`id` éventuel → écriture.
 * Un fichier refusé n'écrit jamais rien.
 */
export function useBackupImport() {
  const [state, setState] = useState<ImportState>({ kind: 'idle' })

  async function importFile(file: File): Promise<void> {
    let text: string
    try {
      text = await file.text()
    } catch {
      setState({ kind: 'read-error', fileName: file.name })
      return
    }
    let result: BackupParseResult
    try {
      result = await validateBackup(text)
    } catch {
      setState({ kind: 'load-error', fileName: file.name })
      return
    }
    if (!result.ok) {
      setState({ kind: 'error', fileName: file.name, issues: result.issues })
      return
    }
    try {
      const existing = await getSession(result.session.id)
      if (existing) {
        setState({ kind: 'conflict', fileName: file.name, incoming: result.session, existing })
        return
      }
      await putSession(result.session)
      setState({ kind: 'idle' })
    } catch {
      setState({ kind: 'write-error', fileName: file.name })
    }
  }

  async function replace(): Promise<void> {
    if (state.kind !== 'conflict') return
    try {
      await putSession(state.incoming)
      setState({ kind: 'idle' })
    } catch {
      setState({ kind: 'write-error', fileName: state.fileName })
    }
  }

  return { state, importFile, replace, dismiss: () => setState({ kind: 'idle' }) }
}
