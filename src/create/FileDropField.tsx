import {
  IconAlertTriangle,
  IconCircleCheck,
  IconCircleX,
  IconLoader2,
  type Icon,
} from '@tabler/icons-react'
import { useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import { Button } from '@/components/ui/button'
import type { Ui } from '@/i18n/use-ui'
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

const STATUS_ICONS: Record<
  CheckedStatus,
  { icon: Icon; label: `create_file_status_${CheckedStatus}`; className: string }
> = {
  ok: { icon: IconCircleCheck, label: 'create_file_status_ok', className: 'text-primary' },
  warnings: {
    icon: IconAlertTriangle,
    label: 'create_file_status_warnings',
    className: 'text-muted-foreground',
  },
  errors: { icon: IconCircleX, label: 'create_file_status_errors', className: 'text-destructive' },
}

function hasFiles(event: DragEvent<HTMLElement>): boolean {
  return Array.from(event.dataTransfer.types).includes('Files')
}

function StatusIcon({ ui, status }: Readonly<{ ui: Ui; status: FileDropStatus }>) {
  if (status === 'empty') return null
  if (status === 'reading') {
    return <IconLoader2 aria-hidden className="size-4 animate-spin text-muted-foreground" />
  }
  const { icon: StateIcon, label, className } = STATUS_ICONS[status]
  return (
    <>
      <StateIcon aria-hidden className={cn('size-4', className)} />
      <span className="sr-only">{ui.text(label, {})}</span>
    </>
  )
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
  const [dragging, setDragging] = useState(false)

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    // Vidé pour qu'un nouveau choix du même fichier redéclenche `change`.
    event.target.value = ''
    if (file) onFile(file)
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    if (!hasFiles(event)) return
    // Toujours empêché : sinon le navigateur ouvre le fichier et quitte l'application.
    event.preventDefault()
    if (disabled) {
      event.dataTransfer.dropEffect = 'none'
      return
    }
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
    if (!disabled && file) onFile(file)
  }

  return (
    // Écouteurs sur un `div` neutre : un `fieldset` (rôle group) n'est pas un élément interactif.
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
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
        {fileName !== undefined && (
          <p className="flex items-center gap-2 text-sm">
            <StatusIcon ui={ui} status={status} />
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
