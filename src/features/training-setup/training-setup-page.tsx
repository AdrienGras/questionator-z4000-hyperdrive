import { Link, useNavigate, useRouter } from '@tanstack/react-router'
import { useEffect, useMemo, useRef, useState, type SubmitEvent } from 'react'
import { DbStatusBanner } from '@/components/db-status-banner'
import { PageShell } from '@/components/page-shell'
import { SMALL_TEXT_LINK_CLASS } from '@/components/text-link'
import { TrainingGate } from '@/components/training-gate'
import { Button } from '@/components/ui/button'
import type { NormalizedConfig } from '@/domain/config/normalize'
import { buildTrainingPrompt } from '@/domain/training/prompt'
import type { Training } from '@/domain/training/types'
import { PAGE_DROP_GUARD } from '@/hooks/use-file-drop'
import { useDbStatus } from '@/lib/db/hooks'
import { useUi, type Ui } from '@/lib/i18n/use-ui'
import { cn } from '@/lib/utils'
import { ConfigStep } from '@/features/training-setup/components/config-step'
import { PromptStep } from '@/features/training-setup/components/prompt-step'
import { SetupStep } from '@/features/training-setup/components/setup-step'
import { useTrainingSetup } from '@/features/training-setup/hooks/use-training-setup'

/** Lien de retour : l'accueil à la création, l'entraînement à la mise à jour. */
function BackLink({ ui, training }: Readonly<{ ui: Ui; training: Training | undefined }>) {
  const className = cn('self-start', SMALL_TEXT_LINK_CLASS)
  if (training === undefined)
    return (
      <Link to="/" className={className}>
        {ui.text('back_home', {})}
      </Link>
    )
  return (
    <Link to="/training/$trainingId" params={{ trainingId: training.id }} className={className}>
      {ui.text('training_update_back', {})}
    </Link>
  )
}

/** Textes propres au mode : création (F43.3) ou mise à jour (F43.4). */
function modeTexts(ui: Ui, updating: boolean) {
  const { text } = ui
  return updating
    ? {
        title: text('training_update_title', {}),
        submit: text('training_update_submit', {}),
        writeError: text('training_update_write_error', {}),
      }
    : {
        title: text('training_setup_title', {}),
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

  async function handleFix() {
    const from = router.state.location.pathname
    if ((await setup.fixInEditor()) && stillHere(from)) await navigate({ to: '/editor' })
  }

  return (
    <PageShell
      ui={ui}
      title={texts.title}
      meta={training?.name}
      back={<BackLink ui={ui} training={training} />}
      {...PAGE_DROP_GUARD}
    >
      <DbStatusBanner ui={ui} status={status} />
      <form onSubmit={(event) => void handleSubmit(event)} className="flex flex-col gap-6">
        <ol className="flex flex-col gap-8">
          <SetupStep number={1} title={text('training_setup_gather_title', {})}>
            <p className="max-w-prose">{text('training_setup_gather_body', {})}</p>
          </SetupStep>
          <SetupStep number={2} title={text('training_setup_prompt_title', {})}>
            <PromptStep ui={ui} prompt={prompt} />
          </SetupStep>
          <SetupStep number={3} title={text('training_setup_config_title', {})}>
            <p className="max-w-prose">{text('training_setup_config_body', {})}</p>
          </SetupStep>
          <SetupStep number={4} title={text('training_setup_drop_title', {})}>
            <ConfigStep ui={ui} setup={setup} onFix={() => void handleFix()} current={current} />
          </SetupStep>
        </ol>
        {setup.submitError && (
          <p role="alert" className="text-sm text-destructive">
            {texts.writeError}
          </p>
        )}
        <Button type="submit" className="self-start" disabled={!setup.canSubmit}>
          {texts.submit}
        </Button>
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
    <TrainingGate
      trainingId={trainingId}
      notFound={ui.text('training_update_not_found', {})}
      damaged={ui.text('training_update_damaged', {})}
    >
      {(training) => <TrainingSetupForm training={training} />}
    </TrainingGate>
  )
}
