import { useState } from 'react'
import { parseBackup, type BackupIssue } from '@/backup'
import { getSession, putSession } from '@/db'
import type { Session } from '@/domain/types'

export type ImportState =
  | { kind: 'idle' }
  | { kind: 'error'; fileName: string; issues: BackupIssue[] }
  | { kind: 'read-error'; fileName: string }
  | { kind: 'conflict'; fileName: string; incoming: Session; existing: Session }
  | { kind: 'write-error'; fileName: string }

/** Appel paresseux : `CSS` n'est lu qu'au moment de la validation (absent de jsdom). */
const cssSupports = (property: string, value: string) => CSS.supports(property, value)

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
    const result = parseBackup(text, { cssSupports })
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
