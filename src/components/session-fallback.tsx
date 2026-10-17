import { IconFileX, IconLoader2 } from '@tabler/icons-react'
import { Link } from '@tanstack/react-router'
import { STATUS_MAIN_CLASS, StatusScreen } from '@/components/status-screen'
import { buttonVariants } from '@/components/ui/button'
import type { Ui } from '@/lib/i18n/use-ui'

type SessionFallbackProps = Readonly<{
  ui: Ui
  kind: 'loading' | 'not-found'
  /** Textes de remplacement (ex. l'écran d'entraînement) ; par défaut, ceux d'une session. */
  messages?: { loading: string; notFound: string }
}>

/** Chargement ou session introuvable, communs aux vues examinateur et projetée. */
export function SessionFallback({ ui, kind, messages }: SessionFallbackProps) {
  const { text } = ui
  if (kind === 'loading') {
    return (
      <main className={STATUS_MAIN_CLASS}>
        <IconLoader2
          aria-hidden
          className="size-6 animate-spin text-link motion-reduce:animate-none"
        />
        <p className="text-muted-foreground">{messages?.loading ?? text('session_loading', {})}</p>
      </main>
    )
  }
  return (
    <StatusScreen icon={<IconFileX />} title={messages?.notFound ?? text('session_not_found', {})}>
      <Link to="/" className={buttonVariants({ variant: 'default' })}>
        {text('back_home', {})}
      </Link>
    </StatusScreen>
  )
}
