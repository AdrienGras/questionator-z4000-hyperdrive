import { Link } from '@tanstack/react-router'
import type { Ui } from '@/lib/i18n/use-ui'

/** Chargement ou session introuvable, communs aux vues examinateur et projetée. */
export function SessionFallback({ ui, kind }: Readonly<{ ui: Ui; kind: 'loading' | 'not-found' }>) {
  const { text } = ui
  if (kind === 'loading') {
    return (
      <main className="flex min-h-svh flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-muted-foreground">{text('session_loading', {})}</p>
      </main>
    )
  }
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-bold">{text('session_not_found', {})}</h1>
      <Link to="/" className="text-primary underline underline-offset-4">
        {text('back_home', {})}
      </Link>
    </main>
  )
}
