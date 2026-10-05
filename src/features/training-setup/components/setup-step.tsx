import { useId, type ReactNode } from 'react'

type SetupStepProps = Readonly<{
  number: number
  title: string
  children: ReactNode
}>

/** Étape numérotée de la mise en place : pastille, titre, contenu. À placer dans un `ol`. */
export function SetupStep({ number, title, children }: SetupStepProps) {
  const titleId = useId()
  return (
    <li aria-labelledby={titleId} className="flex gap-4">
      {/* Numéro décoratif : la liste ordonnée le porte déjà. */}
      <span
        aria-hidden
        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground"
      >
        {number}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <h2 id={titleId} className="pt-1 text-lg font-semibold">
          {title}
        </h2>
        {children}
      </div>
    </li>
  )
}
