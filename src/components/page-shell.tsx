import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/lib/utils'

type PageShellProps = Readonly<{
  /** Titre de la page (rendu dans le `h1`). */
  title: ReactNode
  /** Au-dessus du titre : fil d'Ariane (`Breadcrumb`) ou lien retour (`BackLink`). */
  back?: ReactNode
  /** Ligne d'infos sous le titre. */
  meta?: ReactNode
  /** Actions de la barre, à droite. */
  actions?: ReactNode
  /** Tuile à gauche du titre (page d'espace : `SpaceIcon size="lg"`). */
  icon?: ReactNode
  /** Décor flou en fond : `home` pour l'accueil, `space` pour une page d'espace. */
  halo?: 'home' | 'space'
  children: ReactNode
}> &
  Omit<ComponentProps<'main'>, 'title' | 'children'>

const HALO_CLASS = 'absolute blur-sm'
const HALO_ACTION = 'bg-[radial-gradient(closest-side,var(--color-halo-action),transparent)]'
const HALO_COOL = 'bg-[radial-gradient(closest-side,var(--color-halo-cool),transparent)]'

/**
 * Halos des artboards `accueil` (deux) et `sessions` / `trainings` (un), dérivés de `--primary`.
 * Calque coupé au cadre du `main` sur les deux axes : sans lui, le décor remonte sur la barre du
 * haut du téléphone, peinte avant le `main` (`isolate`).
 */
function PageHalo({ halo }: Readonly<{ halo: 'home' | 'space' }>) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      {halo === 'space' ? (
        <div className={cn(HALO_CLASS, HALO_ACTION, '-top-55 -right-35 h-85 w-140')} />
      ) : (
        <>
          <div className={cn(HALO_CLASS, HALO_ACTION, '-top-50 -right-30 h-95 w-155')} />
          <div className={cn(HALO_CLASS, HALO_COOL, '-top-30 right-90 h-75 w-115')} />
        </>
      )}
    </div>
  )
}

/**
 * Coque commune des pages examinateur (F19, D75) : `main` centré et borné en
 * largeur, barre de titre (retour, titre, infos à gauche ; actions à droite),
 * puis le contenu. L'aide est en pied du menu latéral (D103). `...rest` est
 * transmis au `main` (ex. la garde de dépôt de la création).
 */
export function PageShell({
  title,
  back,
  meta,
  actions,
  icon,
  halo,
  children,
  className,
  ...rest
}: PageShellProps) {
  return (
    <main
      {...rest}
      className={cn(
        'mx-auto flex flex-1 w-full max-w-(--breakpoint-2xl) flex-col gap-6 px-4 py-6 md:px-10 md:py-8',
        halo !== undefined && 'relative isolate',
        className,
      )}
    >
      {halo !== undefined && <PageHalo halo={halo} />}
      <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div className="flex min-w-0 flex-[1_1_20rem] items-center gap-4">
          {icon}
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            {back}
            <h1 className="text-h1 font-bold tracking-tight">{title}</h1>
            {meta !== undefined && <div className="text-muted-foreground">{meta}</div>}
          </div>
        </div>
        {actions !== undefined && (
          <div className="ml-auto flex flex-wrap items-center justify-end gap-2">{actions}</div>
        )}
      </header>
      {children}
    </main>
  )
}
