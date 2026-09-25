import { Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useId, useRef, type DragEvent, type FormEvent } from 'react'
import { ColorModeToggle } from '@/components/color-mode-toggle'
import { DbStatusBanner } from '@/components/db-status-banner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useDbStatus } from '@/lib/db/hooks'
import type { UiMessageParams } from '@/lib/i18n/ui-messages'
import { useUi } from '@/lib/i18n/use-ui'
import { ConfigPreview } from '@/features/create-session/components/config-preview'
import { FileDropField, hasFiles } from '@/features/create-session/components/file-drop-field'
import { StudentsPreview } from '@/features/create-session/components/students-preview'
import { configSlotStatus, studentsSlotStatus } from './slot-status'
import { useCreateForm, type FileSlot } from '@/features/create-session/hooks/use-create-form'

const EXAMPLE_LINK_CLASS = 'text-sm text-primary underline underline-offset-4'

function fileNameOf(slot: FileSlot<unknown>): string | undefined {
  return slot.kind === 'empty' ? undefined : slot.fileName
}

/** Message affiché sous une zone de dépôt quand le fichier n'a pas pu être traité. */
function slotErrorKey(slot: FileSlot<unknown>): keyof UiMessageParams | undefined {
  if (slot.kind === 'read-error') return 'import_read_error'
  if (slot.kind === 'load-error') return 'create_validator_load_error'
  return undefined
}

// Garde de dépôt au niveau de la page : un fichier déposé hors des deux zones ne doit jamais être
// ouvert par le navigateur (le formulaire serait perdu). Les zones gèrent leur propre dépôt et
// s'exécutent avant, par propagation.
function handlePageDragOver(event: DragEvent<HTMLElement>) {
  if (!hasFiles(event)) return
  event.preventDefault()
  event.dataTransfer.dropEffect = 'none'
}

function handlePageDrop(event: DragEvent<HTMLElement>) {
  event.preventDefault()
}

/** Écran de création d'une session (F06) : deux fichiers, nom, examinateur, aperçu. */
export function CreateSessionPage() {
  const ui = useUi()
  const { text, locale } = ui
  const status = useDbStatus()
  const form = useCreateForm(locale, status)
  const navigate = useNavigate()
  const nameId = useId()
  const examinerId = useId()
  const examinerHintId = useId()
  const previewTitleId = useId()
  // Si l'utilisateur a quitté l'écran pendant l'écriture, on ne le ramène pas de force.
  const mounted = useRef(false)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const id = await form.submit()
    if (id !== undefined && mounted.current) {
      await navigate({ to: '/session/$sessionId', params: { sessionId: id } })
    }
  }

  const studentsError = slotErrorKey(form.students)
  const configError = slotErrorKey(form.config)
  const bothEmpty = form.students.kind === 'empty' && form.config.kind === 'empty'

  return (
    // oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- garde de dépôt (voir handlePageDragOver/handlePageDrop) : n'ajoute ni rôle ni interaction clavier, se contente d'empêcher le navigateur d'ouvrir le fichier hors des deux zones dédiées.
    <main
      onDragOver={handlePageDragOver}
      onDrop={handlePageDrop}
      className="mx-auto flex min-h-svh max-w-5xl flex-col gap-6 p-4 sm:p-6"
    >
      <header className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <Link to="/" className="text-sm text-primary underline underline-offset-4">
            {text('back_home', {})}
          </Link>
          <ColorModeToggle ui={ui} />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">{text('create_title', {})}</h1>
      </header>
      <DbStatusBanner ui={ui} status={status} />
      <div className="grid gap-6 md:grid-cols-2">
        <form onSubmit={(event) => void handleSubmit(event)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <FileDropField
              ui={ui}
              label={text('create_students_label', {})}
              accept=".csv,text/csv"
              fileName={fileNameOf(form.students)}
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
              fileName={fileNameOf(form.config)}
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
              className={EXAMPLE_LINK_CLASS}
            >
              {text('create_students_example_link', {})}
            </a>
            <a
              href={`${import.meta.env.BASE_URL}config.example.json`}
              download
              className={EXAMPLE_LINK_CLASS}
            >
              {text('empty_example_link', {})}
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
    </main>
  )
}
