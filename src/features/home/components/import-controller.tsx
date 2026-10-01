import { useState, type ReactNode } from 'react'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { BackupIssue } from '@/domain/backup/issues'
import { formatBackupIssue, formatIssuePath } from '@/domain/backup/messages'
import { useFileDrop } from '@/hooks/use-file-drop'
import { damagedName, isDamaged, type StoredSession } from '@/lib/db/damaged-session'
import { uniqueBy } from '@/lib/issue-list'
import type { Ui } from '@/lib/i18n/use-ui'
import { formatDateTime } from '@/lib/format-date'
import { useBackupImport, type ImportState } from '@/features/home/hooks/use-backup-import'
import { useRetained } from '@/features/home/hooks/use-retained'

type ImportControllerProps = Readonly<{
  ui: Ui
  disabled: boolean
  children: (openPicker: () => void) => ReactNode
}>

/**
 * Import de backup sur l'accueil : input fichier caché (ouvert via `openPicker`), dépôt d'un
 * fichier n'importe où sur la zone, dialogues d'erreur et de conflit d'`id`.
 */
export function ImportController({ ui, disabled, children }: ImportControllerProps) {
  const { text } = ui
  // Élément en état (ref callback) plutôt qu'en `useRef` : `openPicker` est transmis pendant le
  // rendu, et le compilateur React interdit d'y lire une ref.
  const [input, setInput] = useState<HTMLInputElement | null>(null)
  const { state, importing, importFile, replace, dismiss } = useBackupImport()
  // Un dialogue d'import ouvert ou un import en cours : un second fichier ne remplace rien (F34).
  const blocked = disabled || importing || state.kind !== 'idle'
  const { dragging, dropProps } = useFileDrop({
    disabled: blocked,
    onFile: (file) => void importFile(file),
  })

  function openPicker() {
    if (!blocked) input?.click()
  }

  return (
    <div {...dropProps}>
      <input
        ref={setInput}
        type="file"
        accept=".json,application/json"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) void importFile(file)
          // Vidé pour que le même fichier, choisi à nouveau, redéclenche `change`.
          event.target.value = ''
        }}
      />
      {children(openPicker)}
      {dragging && (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4">
          <p className="rounded-xl border-2 border-dashed border-primary px-8 py-12 text-lg font-medium">
            {text('import_drop_hint', {})}
          </p>
        </div>
      )}
      <ImportErrorDialog ui={ui} state={state} onClose={dismiss} />
      <ImportConflictDialog ui={ui} state={state} onCancel={dismiss} onReplace={replace} />
    </div>
  )
}

type ErrorView = { fileName: string; issues: BackupIssue[]; message?: string }

function errorView(state: ImportState, ui: Ui): ErrorView | null {
  if (state.kind === 'error') return { fileName: state.fileName, issues: state.issues }
  if (state.kind === 'read-error')
    return { fileName: state.fileName, issues: [], message: ui.text('import_read_error', {}) }
  if (state.kind === 'load-error')
    return { fileName: state.fileName, issues: [], message: ui.text('import_load_error', {}) }
  if (state.kind === 'write-error')
    return { fileName: state.fileName, issues: [], message: ui.text('write_error', {}) }
  return null
}

type ImportErrorDialogProps = Readonly<{ ui: Ui; state: ImportState; onClose: () => void }>

/** Fichier refusé (toutes les issues, chemin en `<code>`), illisible, ou écriture échouée. */
function ImportErrorDialog({ ui, state, onClose }: ImportErrorDialogProps) {
  const { text, locale } = ui
  const open = errorView(state, ui) !== null
  // Contenu tiré du dernier état d'erreur : il reste affiché pendant l'animation de fermeture.
  const shown = useRetained(open ? state : null)
  const view = shown === null ? null : errorView(shown, ui)
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent showCloseButton={false}>
        {view && (
          <>
            <DialogHeader>
              <DialogTitle>{text('import_error_title', { fileName: view.fileName })}</DialogTitle>
              {view.message !== undefined && <DialogDescription>{view.message}</DialogDescription>}
            </DialogHeader>
            {view.issues.length > 0 && (
              <ul className="flex max-h-80 flex-col gap-2 overflow-y-auto text-sm">
                {uniqueBy(
                  view.issues.map((issue) => ({
                    path: formatIssuePath(issue),
                    message: formatBackupIssue(issue, locale),
                  })),
                  ({ path, message }) => `${path}|${message}`,
                ).map(({ path, message }) => {
                  return (
                    <li key={`${path}|${message}`} className="flex flex-col gap-0.5">
                      {path !== '' && <code className="text-muted-foreground">{path}</code>}
                      <span>{message}</span>
                    </li>
                  )
                })}
              </ul>
            )}
          </>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {text('dialog_close', {})}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

type ImportConflictDialogProps = Readonly<{
  ui: Ui
  state: ImportState
  onCancel: () => void
  onReplace: () => Promise<void>
}>

/** Une session endommagée n'a pas de date fiable : son nom lisible seul (F31). */
function conflictBody({ text, locale }: Ui, existing: StoredSession, imported: string): string {
  if (isDamaged(existing))
    return text('import_conflict_damaged_body', { existing: damagedName(existing), imported })
  return text('import_conflict_body', {
    existing: existing.name,
    date: formatDateTime(existing.updatedAt, locale),
    imported,
  })
}

/** Même `id` déjà en base : remplacer ou annuler ; remplacer une session endommagée la répare. */
function ImportConflictDialog({ ui, state, onCancel, onReplace }: ImportConflictDialogProps) {
  const { text } = ui
  const [replacing, setReplacing] = useState(false)
  const open = state.kind === 'conflict'
  // Contenu tiré du dernier conflit : il reste affiché pendant l'animation de fermeture.
  const shown = useRetained(open ? state : null)
  const conflict = shown?.kind === 'conflict' ? shown : null
  return (
    <AlertDialog open={open} onOpenChange={(next) => !next && !replacing && onCancel()}>
      <AlertDialogContent>
        {conflict && (
          <AlertDialogHeader>
            <AlertDialogTitle>{text('import_conflict_title', {})}</AlertDialogTitle>
            <AlertDialogDescription>
              {conflictBody(ui, conflict.existing, conflict.incoming.name)}
            </AlertDialogDescription>
          </AlertDialogHeader>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={replacing}>{text('dialog_cancel', {})}</AlertDialogCancel>
          <Button
            disabled={replacing}
            onClick={() => {
              setReplacing(true)
              void onReplace().finally(() => setReplacing(false))
            }}
          >
            {text('import_replace', {})}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
