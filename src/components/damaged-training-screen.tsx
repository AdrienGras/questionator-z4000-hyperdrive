import { IconAlertTriangle } from '@tabler/icons-react'
import { Link } from '@tanstack/react-router'
import { ConfigIssueList } from '@/components/config-issue-list'
import { StatusScreen } from '@/components/status-screen'
import { buttonVariants } from '@/components/ui/button'
import type { DamagedTraining } from '@/lib/db/damaged-training'
import type { Ui } from '@/lib/i18n/use-ui'

/**
 * Entraînement illisible, dans la langue de l'interface : sa config n'est pas fiable. `title`
 * remplace le titre par défaut (ex. l'écran de mise à jour).
 */
export function DamagedTrainingScreen({
  ui,
  damaged,
  title,
}: Readonly<{ ui: Ui; damaged: DamagedTraining; title?: string }>) {
  const { text } = ui
  return (
    <StatusScreen
      tone="danger"
      icon={<IconAlertTriangle />}
      title={title ?? text('training_damaged_title', {})}
    >
      <p className="max-w-xl text-muted-foreground">{text('training_damaged_body', {})}</p>
      <div className="w-full max-w-xl text-left">
        <ConfigIssueList ui={ui} issues={damaged.issues} />
      </div>
      {/* Sa carte, avec la suppression, est sur la page Entraînement (l'accueil exclut les endommagés). */}
      <Link to="/trainings" className={buttonVariants({ variant: 'default' })}>
        {text('back_trainings', {})}
      </Link>
    </StatusScreen>
  )
}
