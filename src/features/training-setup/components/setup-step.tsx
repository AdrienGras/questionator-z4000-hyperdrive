import { IconCheck } from '@tabler/icons-react'
import { useId, type ReactNode } from 'react'
import type { Ui } from '@/lib/i18n/use-ui'
import { cn } from '@/lib/utils'
import type { StepState } from '@/features/training-setup/step-states'

type SetupStepProps = Readonly<{
  ui: Ui
  number: number
  total: number
  state: StepState
  title: string
  children: ReactNode
}>

// Pastille de chaque état (artboard `entrainement-mise-en-place`), classes écrites en entier.
const MARKERS: Record<StepState, string> = {
  done: 'bg-space-training/16 text-space-training',
  current: 'bg-linear-135 from-primary to-action-to font-bold text-primary-foreground',
  upcoming: 'border border-border font-semibold text-muted-foreground',
}

/**
 * Étape numérotée de la mise en place, à placer dans un `ol` : pastille et trait vers l'étape
 * suivante, titre, contenu. L'étape en cours est une carte sous un surtitre « Étape N sur 4 » ;
 * l'état est dit dans le titre (texte masqué) et par `aria-current`, la pastille est décorative.
 */
export function SetupStep({ ui, number, total, state, title, children }: SetupStepProps) {
  const { text } = ui
  const titleId = useId()
  const current = state === 'current'
  const heading = (
    <h2
      id={titleId}
      className={cn(
        current ? 'text-h2' : 'text-h3',
        state === 'upcoming' ? 'text-muted-foreground' : 'text-foreground',
      )}
    >
      {/* Espace hors du texte masqué : le calcul du nom accessible rogne celle d'un enfant. */}
      {title}{' '}
      <span className="sr-only">({text('training_setup_step_state', { state })})</span>
    </h2>
  )
  return (
    <li
      aria-labelledby={titleId}
      aria-current={current ? 'step' : undefined}
      className="flex gap-4"
    >
      <div aria-hidden="true" className={cn('flex flex-col items-center', current && 'pt-6')}>
        <span
          className={cn(
            'flex size-8 shrink-0 items-center justify-center rounded-full tabular-nums',
            MARKERS[state],
          )}
        >
          {state === 'done' ? <IconCheck className="size-4.5" /> : number}
        </span>
        {number < total && <span className="mt-1.5 min-h-4 w-0.5 flex-1 rounded-full bg-border" />}
      </div>
      {/* Un seul conteneur, quel que soit l'état : le contenu n'est pas remonté quand l'étape en
          cours change (le bouton de copie garde le focus). */}
      <div
        className={cn(
          'flex min-w-0 flex-1 flex-col',
          current
            ? 'mb-6 gap-4 rounded-lg bg-card p-6 shadow-card outline-1 outline-[color:color-mix(in_oklch,var(--color-primary)_45%,transparent)] outline-solid'
            : 'gap-1.5 pt-1 pb-7',
        )}
      >
        {current ? (
          <span className="text-label text-link uppercase">
            {text('training_setup_step_of', { step: number, total })}
          </span>
        ) : null}
        {heading}
        {children}
      </div>
    </li>
  )
}
