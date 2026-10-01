import { ProjectionCanvas } from '@/components/projection/projection-canvas'
import { ThemeScope } from '@/components/theme-scope'
import type { NormalizedConfig } from '@/domain/config/normalize'
import { previewSession } from '@/domain/presentation/preview-session'
import { toProjectedView } from '@/domain/presentation/projected-view'
import { QuestionPreview } from '@/features/config-editor/components/question-preview'
import type { Ui } from '@/lib/i18n/use-ui'
import { cn } from '@/lib/utils'

type ConfigPreviewProps = Readonly<{
  ui: Ui
  config: NormalizedConfig | undefined
  stale: boolean
}>

/** Aperçu de la dernière config valide : questions par catégorie, puis écran final factice. */
export function ConfigPreview({ ui, config, stale }: ConfigPreviewProps) {
  if (config === undefined) {
    return <p className="text-sm text-muted-foreground">{ui.text('editor_preview_empty', {})}</p>
  }
  return (
    <div className="space-y-4">
      {stale && (
        <output className="block rounded-md border border-amber-500 px-3 py-2 text-sm">
          {ui.text('editor_preview_stale', {})}
        </output>
      )}
      <ThemeScope
        theme={config.theme}
        className={cn(
          'space-y-6 rounded-md bg-background p-4 text-foreground',
          stale && 'opacity-60',
        )}
      >
        {config.categories.map((category) => (
          <section key={category.id} className="space-y-3">
            <h3 className="text-lg font-semibold">{category.label}</h3>
            {category.questions.map((question) => (
              <QuestionPreview key={question.id} ui={ui} category={category} question={question} />
            ))}
          </section>
        ))}
        <section className="space-y-3">
          <h3 className="text-lg font-semibold">{ui.text('editor_final_screen', {})}</h3>
          <ProjectionCanvas view={toProjectedView(previewSession(config))} />
        </section>
      </ThemeScope>
    </div>
  )
}
