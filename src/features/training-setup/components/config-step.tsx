import { categoryAccent } from '@/components/category-tile'
import { CategoryIcon } from '@/components/category-icon'
import { ConfigIssueList } from '@/components/config-issue-list'
import { FileDropField } from '@/components/file-drop-field'
import { configSlotStatus, slotErrorKey, slotFileName } from '@/components/file-slot'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import type { NormalizedConfig } from '@/domain/config/normalize'
import type { Ui } from '@/lib/i18n/use-ui'
import { UpdateSummary } from '@/features/training-setup/components/update-summary'
import type { TrainingSetup } from '@/features/training-setup/hooks/use-training-setup'

type ConfigStepProps = Readonly<{
  ui: Ui
  setup: TrainingSetup
  onFix: () => void
  /** Config actuelle de l'entraînement mis à jour : affiche le bilan sous une config valide. */
  current?: NormalizedConfig
}>

/**
 * Résumé d'une config valide : titre de l'examen, puis une pastille par catégorie teintée de sa
 * couleur (neutre sans couleur), avec son nombre de questions. La pastille est décorative, la
 * phrase masquée la dit.
 */
function TrainingSummary({ ui, config }: Readonly<{ ui: Ui; config: NormalizedConfig }>) {
  return (
    <div className="flex flex-col gap-2.5 border-t pt-4">
      <h3 className="text-h3">{config.exam.title}</h3>
      <ul
        aria-label={ui.text('training_setup_category_counts', {})}
        className="flex flex-wrap gap-2"
      >
        {config.categories.map((category) => (
          <li
            key={category.id}
            style={categoryAccent(category)}
            className="inline-flex h-8 max-w-full items-center gap-2 rounded-sm bg-[color-mix(in_oklch,var(--category-color,var(--color-muted-foreground))_12%,transparent)] px-3 text-small font-semibold text-[var(--category-color,var(--color-muted-foreground))]"
          >
            <span aria-hidden="true" className="flex min-w-0 items-center gap-2">
              {category.icon !== undefined && (
                <CategoryIcon name={category.icon} className="size-4 shrink-0" />
              )}
              <span className="min-w-0 truncate">{category.label}</span>
              <span className="text-foreground tabular-nums">{category.questions.length}</span>
            </span>
            <span className="sr-only">
              {ui.text('training_setup_category_count', {
                label: category.label,
                count: category.questions.length,
              })}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * Config déposée ou collée : zone de dépôt compacte, collage dans un repli (« Vérifier » à
 * l'intérieur), puis, hors du repli, l'état de la validation : visible même repli refermé.
 */
export function ConfigStep({ ui, setup, onFix, current }: ConfigStepProps) {
  const { text } = ui
  const { config } = setup
  const error = slotErrorKey(config)
  const result = config.kind === 'loaded' ? config.result : undefined

  return (
    <div className="flex flex-col gap-4">
      <FileDropField
        ui={ui}
        size="compact"
        label={text('training_setup_file_label', {})}
        emptyHint={text('training_setup_drop_empty', {})}
        accept=".json,application/json"
        fileName={slotFileName(config)}
        status={configSlotStatus(config)}
        onFile={(file) => void setup.setConfigFile(file)}
        disabled={setup.submitting}
      />
      <details className="max-w-155">
        <summary className="min-h-11 cursor-pointer text-sm font-semibold text-muted-foreground">
          {text('training_setup_paste_label', {})}
        </summary>
        <div className="flex flex-col gap-2 pt-2">
          <Textarea
            aria-label={text('training_setup_paste_label', {})}
            value={setup.pasted}
            disabled={setup.submitting}
            onChange={(event) => setup.setPasted(event.target.value)}
            className="field-sizing-fixed h-32 resize-y bg-background font-mono text-xs md:text-xs"
          />
          <Button
            type="button"
            variant="outline"
            className="self-start"
            aria-label={text('training_setup_check_paste', {})}
            disabled={setup.submitting || setup.pasted.trim() === ''}
            onClick={() => void setup.checkPasted()}
          >
            {text('training_setup_check_paste_short', {})}
          </Button>
        </div>
      </details>
      {error !== undefined && (
        <p role="alert" className="text-sm text-destructive">
          {text(error, {})}
        </p>
      )}
      {result !== undefined && (
        <>
          {result.ok && <TrainingSummary ui={ui} config={result.config} />}
          {result.ok && current !== undefined && (
            <UpdateSummary ui={ui} current={current} next={result.config} />
          )}
          <ConfigIssueList ui={ui} issues={result.issues} />
          {setup.canFix && (
            <Button type="button" variant="outline" className="self-start" onClick={onFix}>
              {text('training_setup_fix_in_editor', {})}
            </Button>
          )}
          {setup.fixError && (
            <p role="alert" className="text-sm text-destructive">
              {text('import_read_error', {})}
            </p>
          )}
        </>
      )}
    </div>
  )
}
