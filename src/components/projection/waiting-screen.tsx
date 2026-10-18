import { useUi } from '@/lib/i18n/use-ui'

/**
 * Écran d'attente de la vue projetée (artboard `projection-attente`) : trois points, titre de
 * l'épreuve, message, et la marque en bas à gauche.
 */
export function WaitingScreen({ title }: Readonly<{ title: string }>) {
  const ui = useUi()
  return (
    <div className="relative flex flex-1 flex-col items-center justify-center gap-7 p-16 text-center">
      <div aria-hidden="true" className="flex gap-2.5">
        <span className="size-3.5 rounded-full bg-primary" />
        <span className="size-3.5 rounded-full bg-action-to" />
        <span className="size-3.5 rounded-full bg-muted" />
      </div>
      <h1 className="text-[7rem] leading-[6.75rem] font-extrabold tracking-[-0.035em] wrap-anywhere">
        {title}
      </h1>
      <p className="text-4xl font-medium text-muted-foreground">{ui.text('present_waiting', {})}</p>
      <p className="absolute bottom-9 left-12 flex items-center gap-2.5 text-[0.9375rem] font-semibold text-muted-foreground">
        <span
          aria-hidden="true"
          className="size-5.5 rounded-[7px] bg-linear-135 from-primary to-action-to"
        />
        {ui.text('menu_brand', {})}
      </p>
    </div>
  )
}
