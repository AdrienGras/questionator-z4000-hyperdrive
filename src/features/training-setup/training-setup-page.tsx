import { Link, useNavigate, useRouter } from '@tanstack/react-router'
import { useEffect, useMemo, useRef, type SubmitEvent } from 'react'
import { DbStatusBanner } from '@/components/db-status-banner'
import { PageShell } from '@/components/page-shell'
import { SMALL_TEXT_LINK_CLASS } from '@/components/text-link'
import { Button } from '@/components/ui/button'
import { buildTrainingPrompt } from '@/domain/training/prompt'
import { PAGE_DROP_GUARD } from '@/hooks/use-file-drop'
import { useDbStatus } from '@/lib/db/hooks'
import { useUi } from '@/lib/i18n/use-ui'
import { cn } from '@/lib/utils'
import { ConfigStep } from '@/features/training-setup/components/config-step'
import { PromptStep } from '@/features/training-setup/components/prompt-step'
import { SetupStep } from '@/features/training-setup/components/setup-step'
import { useTrainingSetup } from '@/features/training-setup/hooks/use-training-setup'

/**
 * Écran de mise en place d'un entraînement (F43.3) : quatre étapes, du cours au LLM puis de la
 * config à l'entraînement.
 */
export function TrainingSetupPage() {
  const ui = useUi()
  const { text, locale } = ui
  const status = useDbStatus()
  const setup = useTrainingSetup(status)
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
    const id = await setup.submit()
    if (id !== undefined && stillHere(from)) {
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
      title={text('training_setup_title', {})}
      back={
        <Link to="/" className={cn('self-start', SMALL_TEXT_LINK_CLASS)}>
          {text('back_home', {})}
        </Link>
      }
      {...PAGE_DROP_GUARD}
    >
      <DbStatusBanner ui={ui} status={status} />
      <form
        onSubmit={(event) => void handleSubmit(event)}
        className="flex max-w-3xl flex-col gap-6"
      >
        <ol className="flex flex-col gap-8">
          <SetupStep number={1} title={text('training_setup_gather_title', {})}>
            <p>{text('training_setup_gather_body', {})}</p>
          </SetupStep>
          <SetupStep number={2} title={text('training_setup_prompt_title', {})}>
            <PromptStep ui={ui} prompt={prompt} />
          </SetupStep>
          <SetupStep number={3} title={text('training_setup_config_title', {})}>
            <p>{text('training_setup_config_body', {})}</p>
          </SetupStep>
          <SetupStep number={4} title={text('training_setup_drop_title', {})}>
            <ConfigStep ui={ui} setup={setup} onFix={() => void handleFix()} />
          </SetupStep>
        </ol>
        {setup.submitError && (
          <p role="alert" className="text-sm text-destructive">
            {text('create_write_error', {})}
          </p>
        )}
        <Button type="submit" className="self-start" disabled={!setup.canSubmit}>
          {text('training_setup_submit', {})}
        </Button>
      </form>
    </PageShell>
  )
}
