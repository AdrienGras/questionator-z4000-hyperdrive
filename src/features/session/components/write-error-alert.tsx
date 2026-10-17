import { IconCircleX } from '@tabler/icons-react'
import type { Ui } from '@/lib/i18n/use-ui'

/** Échec d'écriture dans un dialogue de session (artboard `session-dialogues`) : icône et message. */
export function WriteErrorAlert({ ui }: Readonly<{ ui: Ui }>) {
  return (
    <p role="alert" className="flex items-start gap-2 text-small text-destructive">
      <IconCircleX aria-hidden className="mt-px size-4 shrink-0" />
      <span>{ui.text('write_error', {})}</span>
    </p>
  )
}
