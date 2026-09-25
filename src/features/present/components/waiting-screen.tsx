import { ColorModeToggle } from '@/components/color-mode-toggle'
import { useUi } from '@/lib/i18n/use-ui'

/** Écran d'attente de la vue projetée : titre de l'épreuve et message ; bascule de mode en coin. */
export function WaitingScreen({ title }: Readonly<{ title: string }>) {
  const ui = useUi()
  return (
    <main className="relative flex min-h-svh flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="absolute top-4 right-4">
        <ColorModeToggle ui={ui} />
      </div>
      <h1 className="text-4xl font-bold tracking-tight">{title}</h1>
      <p className="text-xl text-muted-foreground">{ui.text('present_waiting', {})}</p>
    </main>
  )
}
