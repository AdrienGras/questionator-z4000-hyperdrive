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
  children: ReactNode
}> &
  Omit<ComponentProps<'main'>, 'title' | 'children'>

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
  children,
  className,
  ...rest
}: PageShellProps) {
  return (
    <main
      {...rest}
      className={cn(
        'mx-auto flex min-h-svh w-full max-w-(--breakpoint-2xl) flex-col gap-6 px-4 py-6 md:px-10 md:py-8',
        className,
      )}
    >
      <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div className="flex min-w-0 flex-[1_1_20rem] flex-col gap-2">
          {back}
          <h1 className="text-h1 font-bold tracking-tight">{title}</h1>
          {meta !== undefined && <div className="text-muted-foreground">{meta}</div>}
        </div>
        {actions !== undefined && (
          <div className="ml-auto flex flex-wrap items-center justify-end gap-2">{actions}</div>
        )}
      </header>
      {children}
    </main>
  )
}
