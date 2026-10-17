import { useNavigate } from '@tanstack/react-router'
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from 'react'
import { IconDownload, IconFileCode, IconPlus, IconRefresh, IconUpload } from '@tabler/icons-react'
import { ActionHalo } from '@/components/action-halo'
import { Breadcrumb } from '@/components/breadcrumb'
import { PageShell } from '@/components/page-shell'
import { SpaceIcon } from '@/components/space-icon'
import { Button } from '@/components/ui/button'
import { configFileName } from '@/domain/config/config-file-name'
import type { ConfigIssue } from '@/domain/config/issues'
import { formatConfigIssue } from '@/domain/config/messages'
import { ConfigPreview } from '@/features/config-editor/components/config-preview'
import { IssueList, type LocatedIssue } from '@/features/config-editor/components/issue-list'
import {
  JsonEditor,
  type JsonEditorApi,
  type JsonEditorDiagnostic,
} from '@/features/config-editor/components/json-editor'
import { EXAMPLE_TEXT, useConfigDraft } from '@/features/config-editor/hooks/use-config-draft'
import { useLiveValidation } from '@/features/config-editor/hooks/use-live-validation'
import { lineAt, locateIssue } from '@/features/config-editor/issue-locations'
import { hasFiles, useFileDrop } from '@/hooks/use-file-drop'
import { stashConfigForCreation } from '@/lib/config-handoff'
import { downloadText } from '@/lib/download'
import { useUi } from '@/lib/i18n/use-ui'
import { cn } from '@/lib/utils'

// Garde de page : un fichier lâché hors de la colonne de l'éditeur ne doit jamais être ouvert par
// le navigateur (le texte en cours serait quitté). La colonne gère son propre dépôt avant.
// Point de rupture de la colonne collante (`lg:sticky`) : en dessous, la page défile.
const STICKY_COLUMN_QUERY = '(min-width: 64rem)'

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
  const { result, lastValid, pending, validatedText, loadError } = useLiveValidation(text)
  const editor = useRef<JsonEditorApi>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  const [readError, setReadError] = useState(false)
  const sourceTitleId = useId()
  const previewTitleId = useId()
  const { save } = draft
  const problemsRef = useRef<HTMLDivElement>(null)

  // Le panneau « Problèmes » est au-dessus du code : quand sa hauteur change (problème apparu ou
  // corrigé), le texte ne doit pas sauter sous le curseur ni sous la souris. Le décalage est
  // compensé avant la peinture : défilement de l'éditeur sur grand écran (colonne collante), de la
  // page sinon, quand on écrit.
  useEffect(() => {
    const panel = problemsRef.current
    if (panel === null || typeof ResizeObserver === 'undefined') return undefined
    let height = panel.offsetHeight
    const observer = new ResizeObserver(() => {
      const delta = panel.offsetHeight - height
      height = panel.offsetHeight
      if (delta === 0) return
      if (window.matchMedia(STICKY_COLUMN_QUERY).matches) editor.current?.scrollBy(delta)
      else if (editor.current?.hasFocus() === true) window.scrollBy(0, delta)
    })
    observer.observe(panel)
    return () => observer.disconnect()
  }, [])

  const handleChange = useCallback(
    (next: string) => {
      setText(next)
      save(next)
    },
    [save],
  )

  // Mémoïsé : l'éditeur redistribue les diagnostics à chaque nouveau tableau. Une seule
  // localisation par issue, sur le texte validé : elle donne le soulignement et la ligne affichée.
  const { diagnostics, located } = useMemo(() => {
    if (result === undefined || validatedText === undefined) {
      return { diagnostics: [] as JsonEditorDiagnostic[], located: [] as LocatedIssue[] }
    }
    const ranges = result.issues.map((issue) => ({
      issue,
      range: locateIssue(validatedText, issue),
    }))
    return {
      diagnostics: ranges.map(({ issue, range }) => ({
        ...range,
        severity: issue.severity,
        message: formatConfigIssue(issue, locale),
      })),
      located: ranges.map(({ issue, range }) => ({
        issue,
        line: lineAt(validatedText, range.from),
      })),
    }
  }, [result, validatedText, locale])

  // Titre de la frame : même nom que « Télécharger », dérivé du texte validé (pas à chaque frappe).
  const fileName = useMemo(
    () => configFileName(validatedText ?? draft.initialText),
    [validatedText, draft.initialText],
  )

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

  // `isolate` : la colonne passe avant la garde de page, qui refuse tout dépôt ailleurs.
  const { dragging, dropProps } = useFileDrop({
    isolate: true,
    onFile: (file) => void loadFile(file),
  })

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    // Vidé pour qu'un nouveau choix du même fichier redéclenche `change`.
    event.target.value = ''
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
      title={t('editor_title', {})}
      back={<Breadcrumb ui={ui} root={{ label: t('menu_editor', {}) }} />}
      icon={<SpaceIcon space="editor" size="lg" />}
      meta={t('editor_subtitle', {})}
      actions={
        <ActionHalo side="end">
          <Button type="button" disabled={pending || result?.ok !== true} onClick={createSession}>
            <IconPlus aria-hidden />
            {t('editor_create_session', {})}
          </Button>
        </ActionHalo>
      }
      onDragOver={handlePageDragOver}
      onDrop={handlePageDrop}
    >
      <div className="flex flex-wrap items-start gap-6">
        {/* Écouteurs de dépôt sur un `div` neutre : la `section` (région) n'est pas interactive. */}
        <div
          {...dropProps}
          className={cn(
            'min-w-0 flex-[999_1_28.75rem] rounded-lg outline-2 outline-offset-4 outline-transparent lg:sticky lg:top-4 lg:h-[calc(100svh-2rem)]',
            dragging && 'outline-primary outline-dashed',
          )}
        >
          <section
            aria-labelledby={sourceTitleId}
            className="flex flex-col overflow-hidden rounded-lg bg-card shadow-card lg:h-full"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b py-2.5 pr-3 pl-4">
              <h2
                id={sourceTitleId}
                className="flex min-w-0 items-center gap-2 text-sm font-semibold wrap-anywhere"
              >
                <IconFileCode aria-hidden className="size-4 shrink-0 text-muted-foreground" />
                {fileName}
              </h2>
              <div className="flex flex-wrap gap-0.5">
                <input
                  ref={fileInput}
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  tabIndex={-1}
                  onChange={handleFileChange}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="px-2.5"
                  aria-label={t('editor_load_file', {})}
                  onClick={() => fileInput.current?.click()}
                >
                  <IconUpload aria-hidden />
                  {t('editor_load_file_short', {})}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="px-2.5"
                  onClick={() => editor.current?.setText(EXAMPLE_TEXT)}
                >
                  <IconRefresh aria-hidden />
                  {t('editor_reset_example', {})}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="px-2.5"
                  onClick={download}
                >
                  <IconDownload aria-hidden />
                  {t('editor_download', {})}
                </Button>
              </div>
            </div>
            {(loadError || readError) && (
              <div className="flex flex-col gap-1 px-4 pt-3">
                {loadError && (
                  <p role="alert" className="text-small text-destructive">
                    {t('editor_validator_error', {})}
                  </p>
                )}
                {readError && (
                  <p role="alert" className="text-small text-destructive">
                    {t('import_read_error', {})}
                  </p>
                )}
              </div>
            )}
            {/* Toujours rendu, au-dessus du code : il ne le pousse pas à la première validation. */}
            <div ref={problemsRef} className="shrink-0 border-b px-4 py-3">
              <IssueList
                ui={ui}
                issues={result === undefined ? undefined : located}
                onSelect={selectIssue}
              />
            </div>
            <JsonEditor
              initialText={draft.initialText}
              onChange={handleChange}
              diagnostics={diagnostics}
              ariaLabel={t('editor_label', {})}
              hoverLabels={{
                default: t('editor_hover_default', {}),
                values: t('editor_hover_values', {}),
                iconSearch: t('editor_hover_icon_search', {}),
                iconHint: t('editor_hover_icon_hint', {}),
              }}
              apiRef={editor}
              className="h-[60vh] lg:h-auto lg:min-h-0 lg:flex-1"
            />
          </section>
        </div>
        <section
          aria-labelledby={previewTitleId}
          className="flex max-w-110 min-w-0 flex-[1_1_22.5rem] flex-col gap-3"
        >
          <div className="flex flex-col gap-0.5">
            <h2 id={previewTitleId} className="text-h2">
              {t('editor_preview_title', {})}
            </h2>
            <p className="text-small text-muted-foreground">{t('editor_preview_subtitle', {})}</p>
          </div>
          <ConfigPreview ui={ui} config={lastValid} stale={result !== undefined && !result.ok} />
        </section>
      </div>
    </PageShell>
  )
}
