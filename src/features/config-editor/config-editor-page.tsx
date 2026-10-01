import { Link, useNavigate } from '@tanstack/react-router'
import {
  useCallback,
  useId,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from 'react'
import { PageShell } from '@/components/page-shell'
import { Button } from '@/components/ui/button'
import type { ConfigIssue } from '@/domain/config/issues'
import { formatConfigIssue } from '@/domain/config/messages'
import { slugify } from '@/domain/session/file-name'
import { ConfigPreview } from '@/features/config-editor/components/config-preview'
import { IssueList } from '@/features/config-editor/components/issue-list'
import {
  JsonEditor,
  type JsonEditorApi,
  type JsonEditorDiagnostic,
} from '@/features/config-editor/components/json-editor'
import { EXAMPLE_TEXT, useConfigDraft } from '@/features/config-editor/hooks/use-config-draft'
import { useLiveValidation } from '@/features/config-editor/hooks/use-live-validation'
import { locateIssue } from '@/features/config-editor/issue-locations'
import { stashConfigForCreation } from '@/lib/config-handoff'
import { downloadText } from '@/lib/download'
import { useUi } from '@/lib/i18n/use-ui'
import { cn } from '@/lib/utils'

/** `<slug du titre>.json` si le texte se parse et porte un `exam.title`, sinon `config.json`. */
function configFileName(text: string): string {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return 'config.json'
  }
  if (typeof parsed !== 'object' || parsed === null || !('exam' in parsed)) return 'config.json'
  const exam = parsed.exam
  if (typeof exam !== 'object' || exam === null || !('title' in exam)) return 'config.json'
  const title = exam.title
  return typeof title === 'string' && title.trim() !== '' ? `${slugify(title)}.json` : 'config.json'
}

/** Un fichier est survolé ou déposé (par opposition à du texte sélectionné glissé). */
function hasFiles(event: DragEvent<HTMLElement>): boolean {
  return Array.from(event.dataTransfer.types).includes('Files')
}

// Garde de page : un fichier lâché hors de la colonne de l'éditeur ne doit jamais être ouvert par
// le navigateur (le texte en cours serait quitté). La colonne gère son propre dépôt avant.
function handlePageDragOver(event: DragEvent<HTMLElement>) {
  if (!hasFiles(event)) return
  event.preventDefault()
  event.dataTransfer.dropEffect = 'none'
}

function handlePageDrop(event: DragEvent<HTMLElement>) {
  event.preventDefault()
}

/**
 * Éditeur de config (F26) : texte JSON validé en direct à gauche (diagnostics, issues cliquables,
 * barre d'outils, dépôt d'un fichier), aperçu de la dernière config valide à droite.
 */
export function ConfigEditorPage() {
  const ui = useUi()
  const { text: t, locale } = ui
  const navigate = useNavigate()
  const draft = useConfigDraft()
  const [text, setText] = useState(draft.initialText)
  const { result, lastValid, validatedText } = useLiveValidation(text)
  const editor = useRef<JsonEditorApi>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [readError, setReadError] = useState(false)
  const sourceTitleId = useId()
  const previewTitleId = useId()
  const { save } = draft

  const handleChange = useCallback(
    (next: string) => {
      setText(next)
      save(next)
    },
    [save],
  )

  // Mémoïsé : l'éditeur redistribue les diagnostics à chaque nouveau tableau.
  const diagnostics = useMemo<JsonEditorDiagnostic[]>(() => {
    if (result === undefined || validatedText === undefined) return []
    return result.issues.map((issue) => ({
      ...locateIssue(validatedText, issue),
      severity: issue.severity,
      message: formatConfigIssue(issue, locale),
    }))
  }, [result, validatedText, locale])

  function selectIssue(issue: ConfigIssue) {
    // Les positions se rapportent au texte validé ; l'éditeur borne une plage devenue trop longue.
    const { from, to } = locateIssue(validatedText ?? text, issue)
    editor.current?.reveal(from, to)
  }

  async function loadFile(file: File) {
    try {
      const content = await file.text()
      setReadError(false)
      editor.current?.setText(content)
    } catch {
      setReadError(true)
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    // Vidé pour qu'un nouveau choix du même fichier redéclenche `change`.
    event.target.value = ''
    if (file) void loadFile(file)
  }

  function handleDragOver(event: DragEvent<HTMLElement>) {
    if (!hasFiles(event)) return
    // Toujours empêché : sinon le navigateur ouvre le fichier et quitte l'application.
    event.preventDefault()
    event.stopPropagation()
    setDragging(true)
  }

  function handleDragLeave(event: DragEvent<HTMLElement>) {
    const next = event.relatedTarget
    if (next instanceof Node && event.currentTarget.contains(next)) return
    setDragging(false)
  }

  function handleDrop(event: DragEvent<HTMLElement>) {
    if (!hasFiles(event)) return
    event.preventDefault()
    event.stopPropagation()
    setDragging(false)
    const file = event.dataTransfer.files[0]
    if (file) void loadFile(file)
  }

  function currentText(): string {
    return editor.current?.getText() ?? text
  }

  function download() {
    const content = currentText()
    downloadText(configFileName(content), content)
  }

  function createSession() {
    const content = currentText()
    stashConfigForCreation({ text: content, fileName: configFileName(content) })
    void navigate({ to: '/new' })
  }

  return (
    <PageShell
      ui={ui}
      title={t('editor_title', {})}
      back={
        <Link to="/" className="self-start text-sm text-primary underline underline-offset-4">
          {t('back_home', {})}
        </Link>
      }
      onDragOver={handlePageDragOver}
      onDrop={handlePageDrop}
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {/* Écouteurs de dépôt sur un `div` neutre : la `section` (région) n'est pas interactive. */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            'min-w-0 rounded-xl outline-2 outline-offset-4 outline-transparent lg:sticky lg:top-4 lg:self-start',
            dragging && 'outline-primary outline-dashed',
          )}
        >
          <section aria-labelledby={sourceTitleId} className="flex flex-col gap-3">
            <h2 id={sourceTitleId} className="text-xl font-semibold">
              {t('editor_source_title', {})}
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={fileInput}
                type="file"
                accept=".json,application/json"
                className="hidden"
                tabIndex={-1}
                onChange={handleFileChange}
              />
              <Button type="button" variant="outline" onClick={() => fileInput.current?.click()}>
                {t('editor_load_file', {})}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => editor.current?.setText(EXAMPLE_TEXT)}
              >
                {t('editor_reset_example', {})}
              </Button>
              <Button type="button" variant="outline" onClick={download}>
                {t('editor_download', {})}
              </Button>
              <Button type="button" disabled={result?.ok !== true} onClick={createSession}>
                {t('editor_create_session', {})}
              </Button>
            </div>
            {readError && (
              <p role="alert" className="text-sm text-destructive">
                {t('import_read_error', {})}
              </p>
            )}
            <JsonEditor
              initialText={draft.initialText}
              onChange={handleChange}
              diagnostics={diagnostics}
              ariaLabel={t('editor_label', {})}
              apiRef={editor}
              className="h-[60vh] lg:h-[calc(100svh-12rem)]"
            />
            {result !== undefined && (
              <IssueList ui={ui} issues={result.issues} onSelect={selectIssue} />
            )}
          </section>
        </div>
        <section aria-labelledby={previewTitleId} className="flex min-w-0 flex-col gap-4">
          <h2 id={previewTitleId} className="text-xl font-semibold">
            {t('editor_preview_title', {})}
          </h2>
          <ConfigPreview ui={ui} config={lastValid} stale={result !== undefined && !result.ok} />
        </section>
      </div>
    </PageShell>
  )
}
