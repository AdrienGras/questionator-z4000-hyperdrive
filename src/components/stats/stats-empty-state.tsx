import { IconChartBar } from '@tabler/icons-react'
import { useId, type ReactNode } from 'react'

type StatsEmptyStateProps = Readonly<{
  /** Titre de la carte ; sans titre, la carte n'est pas une région. */
  title?: string
  body: string
  /** Action de sortie (lien en bouton), posée par l'appelant. */
  action: ReactNode
}>

/** État vide d'un écran de statistiques (artboard `stats-vide`) : carte centrée sous un halo. */
export function StatsEmptyState({ title, body, action }: StatsEmptyStateProps) {
  const headingId = useId()
  return (
    <section
      aria-labelledby={title === undefined ? undefined : headingId}
      className="relative isolate flex flex-col items-center gap-4 overflow-hidden rounded-xl bg-card px-8 py-16 text-center shadow-card"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-38 left-1/2 -z-10 h-95 w-140 -translate-x-1/2 bg-[radial-gradient(closest-side,var(--color-halo-action),transparent)] blur-sm"
      />
      <span className="inline-flex size-14 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <IconChartBar aria-hidden className="size-7" />
      </span>
      {title !== undefined && (
        <h2 id={headingId} className="text-[1.375rem] leading-7 font-bold">
          {title}
        </h2>
      )}
      <p className="max-w-110 text-muted-foreground">{body}</p>
      <div className="mt-2">{action}</div>
    </section>
  )
}
