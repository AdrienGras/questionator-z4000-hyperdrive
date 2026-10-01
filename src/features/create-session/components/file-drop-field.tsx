import {
  IconAlertTriangle,
  IconCircleCheck,
  IconCircleX,
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
}>

type CheckedStatus = Exclude<FileDropStatus, 'empty' | 'reading'>

const STATUS_ICONS: Record<CheckedStatus, { icon: Icon; className: string }> = {
  ok: { icon: IconCircleCheck, className: 'text-primary' },
  warnings: { icon: IconAlertTriangle, className: 'text-muted-foreground' },
  errors: { icon: IconCircleX, className: 'text-destructive' },
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

function StatusIcon({ status }: Readonly<{ status: FileDropStatus }>) {
  if (status === 'empty') return null
  if (status === 'reading') {
    return <IconLoader2 aria-hidden className="size-4 animate-spin text-muted-foreground" />
  }
  const { icon: StateIcon, className } = STATUS_ICONS[status]
  return <StateIcon aria-hidden className={cn('size-4', className)} />
}

/**
 * Zone de dépôt d'un fichier (écran de création) : bouton qui ouvre un input caché, dépôt par
 * glisser-déposer, nom du fichier et icône d'état de sa validation.
 */
export function FileDropField({
  ui,
  label,
  accept,
  fileName,
  status,
  onFile,
  disabled = false,
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

  return (
    // Écouteurs sur un `div` neutre : un `fieldset` (rôle group) n'est pas un élément interactif.
    <div
      {...dropProps}
      className={cn(
        'rounded-xl border-2 border-dashed p-4 transition-colors',
        dragging && 'border-primary',
      )}
    >
      <fieldset className="flex min-w-0 flex-col gap-3">
        <legend className="mb-3 font-medium">{label}</legend>
        <input
          ref={input}
          type="file"
          accept={accept}
          className="hidden"
          tabIndex={-1}
          disabled={disabled}
          onChange={handleChange}
        />
        {/* Toujours monté : une région live n'annonce que les changements d'un élément existant. */}
        <span aria-live="polite" className="sr-only">
          {fileName !== undefined && status !== 'empty' ? text(STATUS_LABELS[status], {}) : ''}
        </span>
        {fileName !== undefined && (
          <p className="flex items-center gap-2 text-sm">
            <StatusIcon status={status} />
            <span className="truncate">{fileName}</span>
          </p>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            onClick={() => input.current?.click()}
          >
            {text(fileName === undefined ? 'create_choose_file' : 'create_replace_file', {})}
          </Button>
          <span className="text-sm text-muted-foreground">{text('create_drop_hint', {})}</span>
        </div>
      </fieldset>
    </div>
  )
}
