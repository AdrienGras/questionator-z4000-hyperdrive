import type { StudentStatus } from '@/domain/scoring/status'
import { STATUS_KEY } from '@/features/session/student-status-label'
import type { Ui } from '@/lib/i18n/use-ui'
import { cn } from '@/lib/utils'

/** Couleurs de statut (F44.7) : en cours en lien, terminé en vert d'espace, le reste neutre. */
const TONE: Record<StudentStatus, string> = {
  todo: 'bg-muted text-muted-foreground',
  in_progress: 'bg-primary/15 text-link',
  done: 'bg-space-training/15 text-space-training',
  absent: 'bg-muted text-muted-foreground',
}

/** Pastille de statut d'un étudiant (artboards `passage-panneau`, `passage-panneau-etudiant`). */
export function StudentStatusPill({ ui, status }: Readonly<{ ui: Ui; status: StudentStatus }>) {
  return (
    <span
      className={cn(
        'inline-flex h-5.5 items-center gap-1.5 self-start rounded-sm px-2 text-label font-semibold whitespace-nowrap',
        TONE[status],
      )}
    >
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      {ui.text(STATUS_KEY[status], {})}
    </span>
  )
}
