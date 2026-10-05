import { Link } from '@tanstack/react-router'
import type { Ui } from '@/lib/i18n/use-ui'
import { TEXT_LINK_CLASS } from '@/components/text-link'

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
      <main className="flex min-h-svh flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-muted-foreground">{messages?.loading ?? text('session_loading', {})}</p>
      </main>
    )
  }
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-bold">{messages?.notFound ?? text('session_not_found', {})}</h1>
      <Link to="/" className={TEXT_LINK_CLASS}>
        {text('back_home', {})}
      </Link>
    </main>
  )
}
