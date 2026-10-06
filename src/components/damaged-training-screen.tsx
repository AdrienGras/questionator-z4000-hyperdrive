import { Link } from '@tanstack/react-router'
import { ConfigIssueList } from '@/components/config-issue-list'
import { TEXT_LINK_CLASS } from '@/components/text-link'
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
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-bold">{title ?? text('training_damaged_title', {})}</h1>
      <p className="max-w-xl text-muted-foreground">{text('training_damaged_body', {})}</p>
      <div className="w-full max-w-xl text-left">
        <ConfigIssueList ui={ui} issues={damaged.issues} />
      </div>
      <Link to="/" className={TEXT_LINK_CLASS}>
        {text('back_home', {})}
      </Link>
    </main>
  )
}
