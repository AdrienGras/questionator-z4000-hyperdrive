import { Link } from '@tanstack/react-router'
import { SessionProgress } from '@/components/session-progress'
import { buttonVariants } from '@/components/ui/button'
import type { Session } from '@/domain/session/types'
import { formatShortDateTime } from '@/lib/format-date'
import type { Ui } from '@/lib/i18n/use-ui'
import { ResumeCard } from './resume-card'

/** Session dans « Reprendre » : titre de l'oral, avancement, lien de reprise. */
export function ResumeSessionCard({ ui, session }: Readonly<{ ui: Ui; session: Session }>) {
  const { locale, text } = ui
  return (
    <ResumeCard
      space="sessions"
      kind={text('home_kind_session', {})}
      date={formatShortDateTime(session.updatedAt, locale)}
      title={session.name}
      subtitle={session.config.exam.title}
      actions={
        <Link
          to="/session/$sessionId"
          params={{ sessionId: session.id }}
          aria-label={text('card_resume_named', { name: session.name })}
          className={buttonVariants({ variant: 'outline', size: 'sm' })}
        >
          {text('card_resume', {})}
        </Link>
      }
    >
      <SessionProgress ui={ui} session={session} />
    </ResumeCard>
  )
}
