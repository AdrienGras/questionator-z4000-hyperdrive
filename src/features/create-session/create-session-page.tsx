import { Link, useNavigate, useRouter } from '@tanstack/react-router'
import { useEffect, useId, useRef, type SubmitEvent } from 'react'
import { DbStatusBanner } from '@/components/db-status-banner'
import { PageShell } from '@/components/page-shell'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
import { SMALL_TEXT_LINK_CLASS } from '@/components/text-link'
import { cn } from '@/lib/utils'

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

  return (
    <PageShell
      ui={ui}
      title={text('create_title', {})}
      back={
        <Link to="/" className={cn('self-start', SMALL_TEXT_LINK_CLASS)}>
          {text('back_home', {})}
        </Link>
      }
      {...PAGE_DROP_GUARD}
    >
      <DbStatusBanner ui={ui} status={status} />
      <div className="grid gap-6 md:grid-cols-2">
        <form onSubmit={(event) => void handleSubmit(event)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
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
              <p role="alert" className="text-sm text-destructive">
                {text(studentsError, {})}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2">
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
              <p role="alert" className="text-sm text-destructive">
                {text(configError, {})}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-x-4">
            <a
              href={`${import.meta.env.BASE_URL}students.example.csv`}
              download
              className={SMALL_TEXT_LINK_CLASS}
            >
              {text('create_students_example_link', {})}
            </a>
            <a
              href={`${import.meta.env.BASE_URL}config.example.json`}
              download
              className={SMALL_TEXT_LINK_CLASS}
            >
              {text('create_config_example_link', {})}
            </a>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={nameId}>{text('rename_label', {})}</Label>
            <Input
              id={nameId}
              value={form.name}
              required
              onChange={(event) => form.setName(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={examinerId}>{text('examiner_label', {})}</Label>
            <Input
              id={examinerId}
              value={form.examiner}
              aria-describedby={examinerHintId}
              onChange={(event) => form.setExaminer(event.target.value)}
            />
            <p id={examinerHintId} className="text-sm text-muted-foreground">
              {text('examiner_hint', {})}
            </p>
          </div>
          {form.submitError && (
            <p role="alert" className="text-sm text-destructive">
              {text('create_write_error', {})}
            </p>
          )}
          <Button type="submit" className="self-start" disabled={!form.canSubmit}>
            {text('create_submit', {})}
          </Button>
        </form>
        <section aria-labelledby={previewTitleId} className="flex flex-col gap-4">
          <h2 id={previewTitleId} className="text-xl font-semibold">
            {text('create_preview_title', {})}
          </h2>
          {bothEmpty && <p className="text-muted-foreground">{text('create_preview_empty', {})}</p>}
          {form.students.kind === 'loaded' && (
            <Card>
              <CardContent>
                <StudentsPreview ui={ui} result={form.students.result} />
              </CardContent>
            </Card>
          )}
          {form.config.kind === 'loaded' && (
            <Card>
              <CardContent>
                <ConfigPreview ui={ui} result={form.config.result} />
              </CardContent>
            </Card>
          )}
        </section>
      </div>
    </PageShell>
  )
}
