import {
  IconAlertTriangle,
  IconCircleCheck,
  IconCircleX,
  IconFileUpload,
  IconLoader2,
  type Icon,
} from '@tabler/icons-react'
import { useRef, type ChangeEvent } from 'react'
import { Button } from '@/components/ui/button'
import { useFileDrop } from '@/hooks/use-file-drop'
import type { Ui } from '@/lib/i18n/use-ui'
import { cn } from '@/lib/utils'

export type FileDropStatus = 'empty' | 'reading' | 'ok' | 'warnings' | 'errors'

type FileDropFieldProps = Readonly<{
  ui: Ui
  label: string
  accept: string
  fileName: string | undefined
  status: FileDropStatus
  onFile: (file: File) => void
  disabled?: boolean
  /**
   * `large` (défaut, écran de création) : zone haute, contenu centré. `compact` (mise en place d'un
   * entraînement) : une rangée, artboards `entrainement-mise-en-place` et `entrainement-mise-a-jour`.
   */
  size?: 'large' | 'compact'
  /** Invite de la zone compacte vide (« Déposez la config (.json) ici »). */
  emptyHint?: string
}>

const STATUS_ICONS: Record<FileDropStatus, { icon: Icon; className: string }> = {
  empty: { icon: IconFileUpload, className: 'text-muted-foreground' },
  reading: { icon: IconLoader2, className: 'animate-spin text-muted-foreground' },
  ok: { icon: IconCircleCheck, className: 'text-space-training' },
  warnings: { icon: IconAlertTriangle, className: 'text-muted-foreground' },
  errors: { icon: IconCircleX, className: 'text-destructive' },
}

// Bordure de la zone selon l'état (artboards `creation-session`, `creation-avertissements`).
const STATUS_BORDERS: Record<FileDropStatus, string> = {
  empty: 'border-dashed border-input',
  reading: 'border-input',
  ok: 'border-space-training',
  warnings: 'border-muted-foreground',
  errors: 'border-destructive',
}

const STATUS_LABELS: Record<
  Exclude<FileDropStatus, 'empty'>,
  `create_file_status_${Exclude<FileDropStatus, 'empty'>}`
> = {
  reading: 'create_file_status_reading',
  ok: 'create_file_status_ok',
  warnings: 'create_file_status_warnings',
  errors: 'create_file_status_errors',
}

/**
 * Zone de dépôt d’un fichier (création de session, mise en place d’un entraînement) : bouton qui ouvre un input caché, dépôt par
 * glisser-déposer, nom du fichier, icône et texte d'état de sa validation, bordure colorée selon
 * cet état.
 */
export function FileDropField({
  ui,
  label,
  accept,
  fileName,
  status,
  onFile,
  disabled = false,
  size = 'large',
  emptyHint,
}: FileDropFieldProps) {
  const { text } = ui
  const input = useRef<HTMLInputElement>(null)
  const { dragging, dropProps } = useFileDrop({ disabled, onFile })

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    // Vidé pour qu'un nouveau choix du même fichier redéclenche `change`.
    event.target.value = ''
    if (file) onFile(file)
  }

  const { icon: StateIcon, className: iconClass } = STATUS_ICONS[status]
  // Toujours monté : une région live n'annonce que les changements d'un élément existant. Visible,
  // et seul nœud de l'état (pas de doublon `sr-only`).
  const liveStatus = (
    <span
      aria-live="polite"
      className={cn(
        'text-small',
        status === 'errors' ? 'text-destructive' : 'text-muted-foreground',
      )}
    >
      {fileName !== undefined && status !== 'empty' ? text(STATUS_LABELS[status], {}) : ''}
    </span>
  )
  const chooseButton = (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={disabled}
      onClick={() => input.current?.click()}
    >
      {text(fileName === undefined ? 'create_choose_file' : 'create_replace_file', {})}
    </Button>
  )

  return (
    // Écouteurs sur un `div` neutre : un `fieldset` (rôle group) n'est pas un élément interactif.
    <div {...dropProps} className="flex min-w-0 flex-1 flex-col">
      <fieldset className="flex min-w-0 flex-1 flex-col">
        <legend className="mb-2 text-small font-semibold">{label}</legend>
        <input
          ref={input}
          type="file"
          accept={accept}
          className="hidden"
          tabIndex={-1}
          disabled={disabled}
          onChange={handleChange}
        />
        {size === 'large' ? (
          <div
            data-status={status}
            className={cn(
              // Toujours au grand format, rempli ou vide : même hauteur que la zone voisine (`flex-1`)
              // et que l'état rempli seul (`min-h-46`).
              'flex min-h-46 flex-1 flex-col items-center justify-center gap-2 rounded-lg border-[1.5px] bg-card px-5 py-6 text-center transition-colors',
              STATUS_BORDERS[status],
              dragging && 'border-dashed border-primary',
            )}
          >
            <StateIcon aria-hidden className={cn('size-7 shrink-0', iconClass)} />
            {fileName !== undefined && (
              <strong className="max-w-full truncate font-semibold">{fileName}</strong>
            )}
            {liveStatus}
            <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
              {chooseButton}
              <span className="text-small text-muted-foreground">
                {text('create_drop_hint', {})}
              </span>
            </div>
          </div>
        ) : (
          <div
            data-status={status}
            className={cn(
              'flex flex-wrap items-center gap-3 rounded-md border-[1.5px] px-4 py-3.5 transition-colors',
              fileName !== undefined && 'bg-background',
              STATUS_BORDERS[status],
              dragging && 'border-dashed border-primary',
            )}
          >
            <StateIcon aria-hidden className={cn('size-5.5 shrink-0', iconClass)} />
            {fileName === undefined ? (
              <span className="min-w-0 flex-1 text-muted-foreground">{emptyHint}</span>
            ) : (
              <strong className="min-w-0 truncate font-semibold">{fileName}</strong>
            )}
            {liveStatus}
            <span className="ml-auto flex flex-wrap items-center gap-2">
              {fileName !== undefined && (
                <span className="text-small text-muted-foreground">
                  {text('create_drop_other', {})}
                </span>
              )}
              {chooseButton}
            </span>
          </div>
        )}
      </fieldset>
    </div>
  )
}
