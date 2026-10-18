export type StepState = 'done' | 'current' | 'upcoming'

type StepStates = readonly [StepState, StepState, StepState, StepState]

/**
 * État des quatre étapes de la mise en place (D103), indicatif seulement : toutes restent
 * utilisables. L'étape en cours est la 4 dès que le prompt a été copié ou qu'une config a été
 * choisie (déposée, ou JSON collé), sinon la 2 ; les étapes 1 et 3 se passent hors de l'application.
 */
export function setupStepStates({
  copied,
  configChosen,
}: Readonly<{ copied: boolean; configChosen: boolean }>): StepStates {
  const current = copied || configChosen ? 4 : 2
  const stateOf = (step: number): StepState => {
    if (step < current) return 'done'
    return step === current ? 'current' : 'upcoming'
  }
  return [stateOf(1), stateOf(2), stateOf(3), stateOf(4)]
}
