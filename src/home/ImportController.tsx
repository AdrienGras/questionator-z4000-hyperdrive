import { useState, type DragEvent, type ReactNode } from 'react'
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
import type { BackupIssue } from '@/backup/issues'
import { formatBackupIssue, formatIssuePath } from '@/backup/messages'
import type { Ui } from '@/i18n/use-ui'
import { formatDateTime } from './format-date'
import { useBackupImport, type ImportState } from './use-backup-import'

type ImportControllerProps = Readonly<{
  ui: Ui
  disabled: boolean
  children: (openPicker: () => void) => ReactNode
}>

function hasFiles(event: DragEvent<HTMLElement>): boolean {
  return Array.from(event.dataTransfer.types).includes('Files')
}

/**
 * Import de backup sur l'accueil : input fichier caché (ouvert via `openPicker`), dépôt d'un
 * fichier n'importe où sur la zone, dialogues d'erreur et de conflit d'`id`.
 */
export function ImportController({ ui, disabled, children }: ImportControllerProps) {
  const { text } = ui
  // Élément en état (ref callback) plutôt qu'en `useRef` : `openPicker` est transmis pendant le
  // rendu, et le compilateur React interdit d'y lire une ref.
  const [input, setInput] = useState<HTMLInputElement | null>(null)
  const [dragging, setDragging] = useState(false)
  const { state, importFile, replace, dismiss } = useBackupImport()

  function openPicker() {
    if (!disabled) input?.click()
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    if (!hasFiles(event)) return
    if (disabled) {
      // Empêche le navigateur d'ouvrir le JSON (et de quitter l'app) sans activer la surimpression.
      event.preventDefault()
      event.dataTransfer.dropEffect = 'none'
      return
    }
    event.preventDefault()
    setDragging(true)
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    const next = event.relatedTarget
    if (next instanceof Node && event.currentTarget.contains(next)) return
    setDragging(false)
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setDragging(false)
    const file = event.dataTransfer.files[0]
    if (!disabled && file) void importFile(file)
  }

  return (
    <div onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
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
      <ImportConflictDialog
        ui={ui}
        state={state}
        onCancel={dismiss}
        onReplace={() => void replace()}
      />
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
  const view = errorView(state, ui)
  return (
    <Dialog open={view !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent showCloseButton={false}>
        {view && (
          <>
            <DialogHeader>
              <DialogTitle>{text('import_error_title', { fileName: view.fileName })}</DialogTitle>
              {view.message !== undefined && <DialogDescription>{view.message}</DialogDescription>}
            </DialogHeader>
            {view.issues.length > 0 && (
              <ul className="flex max-h-80 flex-col gap-2 overflow-y-auto text-sm">
                {view.issues.map((issue) => {
                  const path = formatIssuePath(issue)
                  const message = formatBackupIssue(issue, locale)
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
  onReplace: () => void
}>

/** Même `id` déjà en base : remplacer ou annuler. */
function ImportConflictDialog({ ui, state, onCancel, onReplace }: ImportConflictDialogProps) {
  const { text, locale } = ui
  const conflict = state.kind === 'conflict' ? state : null
  return (
    <AlertDialog open={conflict !== null} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent>
        {conflict && (
          <AlertDialogHeader>
            <AlertDialogTitle>{text('import_conflict_title', {})}</AlertDialogTitle>
            <AlertDialogDescription>
              {text('import_conflict_body', {
                existing: conflict.existing.name,
                date: formatDateTime(conflict.existing.updatedAt, locale),
                imported: conflict.incoming.name,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel>{text('dialog_cancel', {})}</AlertDialogCancel>
          <Button onClick={onReplace}>{text('import_replace', {})}</Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
