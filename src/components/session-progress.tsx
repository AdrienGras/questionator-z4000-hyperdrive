import { Progress } from '@/components/ui/progress'
import { sessionProgress } from '@/domain/session/progress'
import type { Session } from '@/domain/session/types'
import type { Ui } from '@/lib/i18n/use-ui'

type SessionProgressProps = Readonly<{ ui: Ui; session: Session }>

/** Avancement d'une session : passés en chiffre clé sur le total, jauge, puis absents et restants. */
export function SessionProgress({ ui, session }: SessionProgressProps) {
  const { text } = ui
  const { done, absent, remaining, total } = sessionProgress(session)
  return (
    <div className="flex flex-col gap-2">
      <p className="flex items-baseline gap-1.5">
        <span className="text-score-md tabular-nums">{done}</span>
        <span className="text-[13px] leading-[18px] text-muted-foreground tabular-nums">
          {text('card_progress_of', { total })}
        </span>
      </p>
      <Progress
        value={total === 0 ? 0 : (done / total) * 100}
        aria-label={text('card_progress', { done, absent, remaining })}
      />
      <p className="text-[13px] leading-[18px] text-muted-foreground tabular-nums">
        {text('card_progress_rest', { absent, remaining })}
      </p>
    </div>
  )
}
