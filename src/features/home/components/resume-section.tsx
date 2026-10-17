import type { Ui } from '@/lib/i18n/use-ui'
import type { RecentItem } from '@/features/home/recent-activity'
import { ResumeSessionCard } from './resume-session-card'
import { ResumeTrainingCard } from './resume-training-card'

type ResumeSectionProps = Readonly<{ ui: Ui; items: readonly RecentItem[] }>

/** « Reprendre » : les éléments récents, en grille d'une colonne au téléphone. */
export function ResumeSection({ ui, items }: ResumeSectionProps) {
  return (
    <section aria-labelledby="home-resume-title" className="flex flex-col gap-4">
      <h2 id="home-resume-title" className="text-h2">
        {ui.text('home_resume_title', {})}
      </h2>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,260px),1fr))] gap-4">
        {items.map((item) =>
          item.kind === 'session' ? (
            <ResumeSessionCard key={`s:${item.session.id}`} ui={ui} session={item.session} />
          ) : (
            <ResumeTrainingCard key={`t:${item.training.id}`} ui={ui} training={item.training} />
          ),
        )}
      </div>
    </section>
  )
}
