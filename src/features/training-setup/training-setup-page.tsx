import { useNavigate, useRouter } from '@tanstack/react-router'
import { useEffect, useId, useMemo, useRef, useState, type SubmitEvent } from 'react'
import { DbStatusBanner } from '@/components/db-status-banner'
import { BackLink } from '@/components/back-link'
import { PageShell } from '@/components/page-shell'
import { SpaceIcon } from '@/components/space-icon'
import { TrainingGate } from '@/components/training-gate'
import { Button } from '@/components/ui/button'
import type { NormalizedConfig } from '@/domain/config/normalize'
import { buildTrainingPrompt } from '@/domain/training/prompt'
import type { Training } from '@/domain/training/types'
import { PAGE_DROP_GUARD } from '@/hooks/use-file-drop'
import { copyText } from '@/lib/clipboard'
import { useDbStatus } from '@/lib/db/hooks'
import { useUi, type Ui } from '@/lib/i18n/use-ui'
import { ConfigStep } from '@/features/training-setup/components/config-step'
import { PromptStep, type PromptCopy } from '@/features/training-setup/components/prompt-step'
import { SetupStep } from '@/features/training-setup/components/setup-step'
import { useTrainingSetup } from '@/features/training-setup/hooks/use-training-setup'
import { setupStepStates } from '@/features/training-setup/step-states'

/** Nombre d'étapes de la mise en place. */
const STEPS = 4

/** Lien de retour : l'accueil à la création, l'entraînement à la mise à jour. */
function SetupBackLink({ ui, training }: Readonly<{ ui: Ui; training: Training | undefined }>) {
  if (training === undefined) return <BackLink to="/">{ui.text('back_home', {})}</BackLink>
  return (
    <BackLink to="/training/$trainingId" params={{ trainingId: training.id }}>
      {ui.text('training_update_back', {})}
    </BackLink>
  )
}

/** Textes propres au mode : création (F43.3) ou mise à jour (F43.4). */
function modeTexts(ui: Ui, updating: boolean) {
  const { text } = ui
  return updating
    ? {
        title: text('training_update_title', {}),
        subtitle: undefined,
        submit: text('training_update_submit', {}),
        writeError: text('training_update_write_error', {}),
      }
    : {
        title: text('training_setup_title', {}),
        subtitle: text('training_setup_subtitle', {}),
        submit: text('training_setup_submit', {}),
        writeError: text('create_write_error', {}),
      }
}

/**
 * Formulaire en quatre étapes, du cours au LLM puis de la config à l'entraînement. Avec
 * `training`, la config de cet entraînement est remplacée, après un bilan.
 */
function TrainingSetupForm({ training }: Readonly<{ training?: Training }>) {
  const ui = useUi()
  const { text, locale } = ui
  const status = useDbStatus()
  const setup = useTrainingSetup(status, training?.id)
  const texts = modeTexts(ui, training !== undefined)
  // Config de référence du bilan, figée pendant l'écriture : sinon la base relue, déjà remplacée,
  // afficherait un bilan vide juste avant la navigation.
  const [frozen, setFrozen] = useState<NormalizedConfig | undefined>(undefined)
  const current = training === undefined ? undefined : (frozen ?? training.config)
  const navigate = useNavigate()
  const router = useRouter()
  const prompt = useMemo(() => buildTrainingPrompt(locale), [locale])
  const [copy, setCopy] = useState<PromptCopy>({ copied: false, failed: false })
  const states = setupStepStates({
    copied: copy.copied,
    // Un texte collé compte comme une config en cours : le retoucher, ce qui vide l'emplacement
    // vérifié, ne ramène pas l'étape en cours à la 2 (la page bougerait sous le curseur).
    configChosen: setup.config.kind !== 'empty' || setup.pasted.trim() !== '',
  })
  const blockerId = useId()
  // Si l'utilisateur a quitté l'écran pendant l'écriture, on ne le ramène pas de force ; le chemin
  // est aussi comparé, comme à l'écran de création d'une session.
  const mounted = useRef(false)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  function stillHere(from: string): boolean {
    return mounted.current && router.state.location.pathname === from
  }

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    const from = router.state.location.pathname
    setFrozen(current)
    const id = await setup.submit()
    if (id === undefined) setFrozen(undefined)
    else if (stillHere(from)) {
      await navigate({ to: '/training/$trainingId', params: { trainingId: id } })
    }
  }

  async function handleCopy() {
    const ok = await copyText(prompt)
    setCopy((previous) => ({ copied: previous.copied || ok, failed: !ok }))
  }

  async function handleFix() {
    const from = router.state.location.pathname
    if ((await setup.fixInEditor()) && stillHere(from)) await navigate({ to: '/editor' })
  }

  return (
    <PageShell
      title={texts.title}
      meta={training?.name ?? texts.subtitle}
      icon={<SpaceIcon space="training" size="lg" />}
      back={<SetupBackLink ui={ui} training={training} />}
      {...PAGE_DROP_GUARD}
    >
      <DbStatusBanner ui={ui} status={status} />
      <form
        onSubmit={(event) => void handleSubmit(event)}
        className="flex max-w-205 flex-col gap-2"
      >
        <ol>
          <SetupStep
            ui={ui}
            number={1}
            total={STEPS}
            state={states[0]}
            title={text('training_setup_gather_title', {})}
          >
            <p className="max-w-155 text-muted-foreground">
              {text('training_setup_gather_body', {})}
            </p>
          </SetupStep>
          <SetupStep
            ui={ui}
            number={2}
            total={STEPS}
            state={states[1]}
            title={text('training_setup_prompt_title', {})}
          >
            <PromptStep ui={ui} prompt={prompt} copy={copy} onCopy={() => void handleCopy()} />
          </SetupStep>
          <SetupStep
            ui={ui}
            number={3}
            total={STEPS}
            state={states[2]}
            title={text('training_setup_config_title', {})}
          >
            <p className="max-w-155 text-muted-foreground">
              {text('training_setup_config_body', {})}
            </p>
          </SetupStep>
          <SetupStep
            ui={ui}
            number={4}
            total={STEPS}
            state={states[3]}
            title={text('training_setup_drop_title', {})}
          >
            <ConfigStep ui={ui} setup={setup} onFix={() => void handleFix()} current={current} />
          </SetupStep>
        </ol>
        {setup.submitError && (
          <p role="alert" className="pl-12 text-sm text-destructive">
            {texts.writeError}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-3 pl-12">
          <Button
            type="submit"
            disabled={!setup.canSubmit}
            aria-describedby={setup.configReady ? undefined : blockerId}
          >
            {texts.submit}
          </Button>
          {!setup.configReady && (
            <span id={blockerId} className="text-small text-muted-foreground">
              {text('training_setup_submit_blocker', {})}
            </span>
          )}
        </div>
      </form>
    </PageShell>
  )
}

type TrainingSetupPageProps = Readonly<{
  /** Entraînement dont la config est mise à jour (F43.4) ; absent, un entraînement est créé. */
  trainingId?: string
}>

/**
 * Écran de mise en place d'un entraînement (F43.3) ou de mise à jour de sa config (F43.4) : en
 * mise à jour, les états absent, endommagé et chargement sont ceux de `TrainingGate`.
 */
export function TrainingSetupPage({ trainingId }: TrainingSetupPageProps) {
  const ui = useUi()
  if (trainingId === undefined) return <TrainingSetupForm />
  return (
    <TrainingGate trainingId={trainingId} damaged={ui.text('training_update_damaged', {})}>
      {(training) => <TrainingSetupForm training={training} />}
    </TrainingGate>
  )
}
