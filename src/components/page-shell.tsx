import type { ComponentProps, ReactNode } from 'react'
import { ColorModeToggle } from '@/components/color-mode-toggle'
import type { Ui } from '@/lib/i18n/use-ui'
import { cn } from '@/lib/utils'

type PageShellProps = Readonly<{
  ui: Ui
  /** Titre de la page (rendu dans le `h1`). */
  title: ReactNode
  /** Lien de retour, au-dessus du titre. */
  back?: ReactNode
  /** Ligne d'infos sous le titre. */
  meta?: ReactNode
  /** Actions de la barre, à droite, avant le bouton de thème. */
  actions?: ReactNode
  children: ReactNode
}> &
  Omit<ComponentProps<'main'>, 'title' | 'children'>

/**
 * Coque commune des pages examinateur (F19, D75) : `main` centré et borné en
 * largeur, barre de titre (retour, titre, infos à gauche ; actions puis thème
 * à droite), puis le contenu. Le bouton de thème est toujours le dernier de la
 * barre et n'est pas paramétrable. `...rest` est transmis au `main` (ex. la
 * garde de dépôt de la création).
 */
export function PageShell({
  ui,
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
        'mx-auto flex min-h-svh w-full max-w-(--breakpoint-2xl) flex-col gap-6 px-4 py-4 sm:px-6 sm:py-6 lg:px-10',
        className,
      )}
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-[1_1_20rem] flex-col gap-1">
          {back}
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {meta}
        </div>
        <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
          {actions}
          <ColorModeToggle ui={ui} />
        </div>
      </header>
      {children}
    </main>
  )
}
