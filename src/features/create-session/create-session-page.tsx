import { IconDownload, IconPlus } from '@tabler/icons-react'
import { useNavigate, useRouter } from '@tanstack/react-router'
import { useEffect, useId, useRef, type SubmitEvent } from 'react'
import { DbStatusBanner } from '@/components/db-status-banner'
import { Breadcrumb } from '@/components/breadcrumb'
import { PageShell } from '@/components/page-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { takeConfigForCreation } from '@/lib/config-handoff'
import { useDbStatus } from '@/lib/db/hooks'
import { useUi } from '@/lib/i18n/use-ui'
import { ConfigPreview } from '@/features/create-session/components/config-preview'
import { FileDropField } from '@/components/file-drop-field'
import { PAGE_DROP_GUARD } from '@/hooks/use-file-drop'
import { StudentsPreview } from '@/features/create-session/components/students-preview'
import { configSlotStatus, slotErrorKey, slotFileName } from '@/components/file-slot'
import { studentsSlotStatus } from './slot-status'
import { useCreateForm } from '@/features/create-session/hooks/use-create-form'
import { ActionHalo } from '@/components/action-halo'
import { SpaceIcon } from '@/components/space-icon'
import { submitBlocker, type SubmitBlocker } from '@/features/create-session/submit-blocker'

// Liens d'exemple discrets (artboard `creation-session`) : gris secondaire, soulignés.
const EXAMPLE_LINK_CLASS =
  'inline-flex items-center gap-1.5 text-muted-foreground underline underline-offset-4 hover:text-foreground'

const BLOCKER_MESSAGES: Record<SubmitBlocker, `create_blocked_${SubmitBlocker}`> = {
  db: 'create_blocked_db',
  students: 'create_blocked_students',
  config: 'create_blocked_config',
  files: 'create_blocked_files',
  name: 'create_blocked_name',
}

/** Écran de création d'une session (F06) : deux fichiers, nom, examinateur, aperçu. */
export function CreateSessionPage() {
  const ui = useUi()
  const { text, locale } = ui
  const status = useDbStatus()
  const form = useCreateForm(locale, status)
  const navigate = useNavigate()
  const router = useRouter()
  const nameId = useId()
  const examinerId = useId()
  const examinerHintId = useId()
  const previewTitleId = useId()
  const blockerId = useId()
  // Si l'utilisateur a quitté l'écran pendant l'écriture, on ne le ramène pas de force. Le démontage
  // ne suffit pas : pendant le chargement de la route demandée, l'écran reste monté alors que
  // `router.state.location` désigne déjà la destination ; on compare donc aussi le chemin.
  const mounted = useRef(false)
  // Dernière version du setter : l'effet de montage ne doit pas se rejouer à chaque rendu.
  const setConfigText = useRef(form.setConfigText)

  useEffect(() => {
    setConfigText.current = form.setConfigText
  })

  useEffect(() => {
    mounted.current = true
    // Config passée depuis l'éditeur (F26) : traitée comme un fichier déposé.
    const handoff = takeConfigForCreation()
    if (handoff !== undefined) void setConfigText.current(handoff.text, handoff.fileName)
    return () => {
      mounted.current = false
    }
  }, [])

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    const from = router.state.location.pathname
    const id = await form.submit()
    if (id !== undefined && mounted.current && router.state.location.pathname === from) {
      await navigate({ to: '/session/$sessionId', params: { sessionId: id } })
    }
  }

  const studentsError = slotErrorKey(form.students)
  const configError = slotErrorKey(form.config)
  const bothEmpty = form.students.kind === 'empty' && form.config.kind === 'empty'
  const blocker = submitBlocker(form, status)

  return (
    <PageShell
      title={text('create_title', {})}
      back={<Breadcrumb ui={ui} root={{ label: text('menu_sessions', {}), to: '/sessions' }} />}
      icon={<SpaceIcon space="sessions" size="lg" />}
      meta={text('create_subtitle', {})}
      {...PAGE_DROP_GUARD}
    >
      <DbStatusBanner ui={ui} status={status} />
      <div className="flex flex-wrap items-start gap-8">
        <form
          onSubmit={(event) => void handleSubmit(event)}
          className="flex min-w-0 flex-[999_1_27.5rem] flex-col gap-6"
        >
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,13.75rem),1fr))] gap-4">
            <div className="flex min-w-0 flex-col gap-2">
              <FileDropField
                ui={ui}
                label={text('create_students_label', {})}
                accept=".csv,text/csv"
                fileName={slotFileName(form.students)}
                status={studentsSlotStatus(form.students)}
                onFile={(file) => void form.setStudentsFile(file)}
                disabled={form.submitting}
              />
              {studentsError !== undefined && (
                <p role="alert" className="text-small text-destructive">
                  {text(studentsError, {})}
                </p>
              )}
            </div>
            <div className="flex min-w-0 flex-col gap-2">
              <FileDropField
                ui={ui}
                label={text('create_config_label', {})}
                accept=".json,application/json"
                fileName={slotFileName(form.config)}
                status={configSlotStatus(form.config)}
                onFile={(file) => void form.setConfigFile(file)}
                disabled={form.submitting}
              />
              {configError !== undefined && (
                <p role="alert" className="text-small text-destructive">
                  {text(configError, {})}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-small">
            <a
              href={`${import.meta.env.BASE_URL}students.example.csv`}
              download
              aria-label={text('create_students_example_link', {})}
              className={EXAMPLE_LINK_CLASS}
            >
              <IconDownload aria-hidden className="size-3.5 shrink-0" />
              {text('create_students_example_short', {})}
            </a>
            <a
              href={`${import.meta.env.BASE_URL}config.example.json`}
              download
              aria-label={text('create_config_example_link', {})}
              className={EXAMPLE_LINK_CLASS}
            >
              <IconDownload aria-hidden className="size-3.5 shrink-0" />
              {text('create_config_example_short', {})}
            </a>
          </div>
          <div className="flex flex-col gap-4 border-t pt-6">
            <div className="flex min-w-0 flex-col gap-1.5">
              <Label htmlFor={nameId} className="text-small font-semibold">
                {text('rename_label', {})}
              </Label>
              <Input
                id={nameId}
                value={form.name}
                required
                className="h-11"
                onChange={(event) => form.setName(event.target.value)}
              />
            </div>
            <div className="flex min-w-0 flex-col gap-1.5">
              <Label htmlFor={examinerId} className="text-small font-semibold">
                {text('examiner_label', {})}{' '}
                <span className="font-normal text-muted-foreground">
                  {text('optional_hint', {})}
                </span>
              </Label>
              <Input
                id={examinerId}
                value={form.examiner}
                aria-describedby={examinerHintId}
                className="h-11"
                onChange={(event) => form.setExaminer(event.target.value)}
              />
              <p id={examinerHintId} className="text-small text-muted-foreground">
                {text('create_examiner_hint', {})}
              </p>
            </div>
          </div>
          {form.submitError && (
            <p role="alert" className="text-small text-destructive">
              {text('create_write_error', {})}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
            <ActionHalo side="start">
              <Button
                type="submit"
                disabled={!form.canSubmit}
                aria-describedby={blocker === undefined ? undefined : blockerId}
              >
                <IconPlus aria-hidden />
                {text('create_submit', {})}
              </Button>
            </ActionHalo>
            {blocker !== undefined && (
              <p id={blockerId} className="text-small text-muted-foreground">
                {text(BLOCKER_MESSAGES[blocker], {})}
              </p>
            )}
          </div>
        </form>
        <section
          aria-labelledby={previewTitleId}
          className="flex max-w-90 min-w-0 flex-[1_1_18.75rem] flex-col gap-3"
        >
          <h2 id={previewTitleId} className="text-h2">
            {text('create_preview_title', {})}
          </h2>
          {bothEmpty && <p className="text-muted-foreground">{text('create_preview_empty', {})}</p>}
          {form.students.kind === 'loaded' && (
            <StudentsPreview ui={ui} result={form.students.result} />
          )}
          {form.config.kind === 'loaded' && <ConfigPreview ui={ui} result={form.config.result} />}
        </section>
      </div>
    </PageShell>
  )
}
