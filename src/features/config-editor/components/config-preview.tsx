import { IconAlertTriangle } from '@tabler/icons-react'
import { useId, useMemo } from 'react'
import { ProjectionCanvas } from '@/components/projection/projection-canvas'
import { ThemeScope } from '@/components/theme-scope'
import type { NormalizedConfig } from '@/domain/config/normalize'
import { previewSession } from '@/domain/presentation/preview-session'
import { toProjectedView } from '@/domain/presentation/projected-view'
import { QuestionPreview } from '@/features/config-editor/components/question-preview'
import { LocaleScope, resolveSessionLocale } from '@/lib/i18n/locale-context'
import type { Ui } from '@/lib/i18n/use-ui'
import { cn } from '@/lib/utils'

type ConfigPreviewProps = Readonly<{
  ui: Ui
  config: NormalizedConfig | undefined
  stale: boolean
}>

type Target = Readonly<{ id: string; label: string; color?: string; count?: number }>

/**
 * Fait défiler la frame jusqu'à la section `id` et donne le focus à son titre. Des boutons et non
 * des ancres : avec le routage par hash, `href="#…"` changerait de page.
 */
function goTo(id: string) {
  const section = document.getElementById(id)
  if (section === null) return
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
  section.scrollIntoView({ block: 'start', behavior: reduced ? 'auto' : 'smooth' })
  section.querySelector<HTMLElement>('h3')?.focus({ preventScroll: true })
}

function CategoryNav({ ui, targets }: Readonly<{ ui: Ui; targets: readonly Target[] }>) {
  return (
    <nav aria-label={ui.text('editor_preview_nav', {})} className="flex flex-wrap gap-1.5">
      {targets.map((target) => (
        <button
          key={target.id}
          type="button"
          onClick={() => goTo(target.id)}
          className="inline-flex h-7 items-center gap-1.5 rounded-sm bg-muted px-2.5 text-small font-medium hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          {target.color !== undefined && (
            <span
              aria-hidden
              style={{ backgroundColor: target.color }}
              className="size-2 shrink-0 rounded-full"
            />
          )}
          {target.label}
          {target.count !== undefined && (
            <span className="text-muted-foreground tabular-nums">{target.count}</span>
          )}
        </button>
      ))}
    </nav>
  )
}

/**
 * Aperçu de la dernière config valide : navigation par catégorie, puis questions par catégorie et
 * écran final factice, dans une frame au thème de la config. Le contenu suit la langue de la config
 * (`LocaleScope`, sans toucher `<html lang>`) ; l'habillage (bandeau, puces, intitulés « Réponse
 * attendue », « Écran final ») reste dans celle de l'éditeur (`ui`).
 */
export function ConfigPreview({ ui, config, stale }: ConfigPreviewProps) {
  const sectionId = useId()
  const finalView = useMemo(
    () => (config === undefined ? undefined : toProjectedView(previewSession(config))),
    [config],
  )
  const configLocale = resolveSessionLocale(config?.locale)
  if (config === undefined || finalView === undefined) {
    return <p className="text-sm text-muted-foreground">{ui.text('editor_preview_empty', {})}</p>
  }
  // Ids dérivés du rang, jamais de `category.id` (n'importe quel caractère).
  const finalId = `${sectionId}-final`
  const targets: Target[] = [
    ...config.categories.map((category, index) => ({
      id: `${sectionId}-${index}`,
      label: category.label,
      color: category.color,
      count: category.questions.length,
    })),
    { id: finalId, label: ui.text('editor_final_screen', {}) },
  ]
  return (
    <div className="flex flex-col gap-3">
      {stale && (
        <output className="flex items-start gap-2 rounded-md bg-muted px-3 py-2 text-small">
          <IconAlertTriangle aria-hidden className="mt-px size-4 shrink-0 text-space-editor" />
          {ui.text('editor_preview_stale', {})}
        </output>
      )}
      <CategoryNav ui={ui} targets={targets} />
      <ThemeScope
        theme={config.theme}
        className={cn(
          'flex max-h-160 flex-col gap-3 overflow-auto rounded-lg bg-background p-4 text-foreground',
          stale && 'opacity-60',
        )}
      >
        <LocaleScope locale={configLocale}>
          <div lang={configLocale} className="flex flex-col gap-6">
            {config.categories.map((category, index) => (
              <section
                key={category.id}
                id={`${sectionId}-${index}`}
                className="flex flex-col gap-3"
              >
                <h3 tabIndex={-1} className="text-lg font-bold outline-none">
                  {category.label}
                </h3>
                {category.questions.map((question) => (
                  <QuestionPreview
                    key={question.id}
                    ui={ui}
                    category={category}
                    question={question}
                  />
                ))}
              </section>
            ))}
            <section id={finalId} className="flex flex-col gap-3">
              <h3 tabIndex={-1} lang={ui.locale} className="text-lg font-bold outline-none">
                {ui.text('editor_final_screen', {})}
              </h3>
              <ProjectionCanvas view={finalView} />
            </section>
          </div>
        </LocaleScope>
      </ThemeScope>
    </div>
  )
}
