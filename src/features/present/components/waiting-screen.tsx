import { useUi } from '@/lib/i18n/use-ui'

/** Écran d'attente de la vue projetée : titre de l'épreuve et message. */
export function WaitingScreen({ title }: Readonly<{ title: string }>) {
  const ui = useUi()
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-4xl font-bold tracking-tight">{title}</h1>
      <p className="text-xl text-muted-foreground">{ui.text('present_waiting', {})}</p>
    </div>
  )
}
