import { useId } from 'react'
import { ConfigIssueList } from '@/components/config-issue-list'
import { FileDropField } from '@/components/file-drop-field'
import { configSlotStatus, slotErrorKey, slotFileName } from '@/components/file-slot'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { NormalizedConfig } from '@/domain/config/normalize'
import type { Ui } from '@/lib/i18n/use-ui'
import type { TrainingSetup } from '@/features/training-setup/hooks/use-training-setup'

type ConfigStepProps = Readonly<{
  ui: Ui
  setup: TrainingSetup
  onFix: () => void
}>

/** Résumé d'une config valide : titre de l'examen, nombre de questions par catégorie. */
function TrainingSummary({ ui, config }: Readonly<{ ui: Ui; config: NormalizedConfig }>) {
  return (
    <>
      <h3 className="font-semibold">{config.exam.title}</h3>
      <ul className="list-disc pl-6 text-sm">
        {config.categories.map((category) => (
          <li key={category.id}>
            {ui.text('training_setup_category_count', {
              label: category.label,
              count: category.questions.length,
            })}
          </li>
        ))}
      </ul>
    </>
  )
}

/** Config déposée ou collée : zone de dépôt, zone de collage, état de la validation. */
export function ConfigStep({ ui, setup, onFix }: ConfigStepProps) {
  const { text } = ui
  const pasteId = useId()
  const { config } = setup
  const error = slotErrorKey(config)
  const result = config.kind === 'loaded' ? config.result : undefined

  return (
    <>
      <FileDropField
        ui={ui}
        label={text('training_setup_file_label', {})}
        accept=".json,application/json"
        fileName={slotFileName(config)}
        status={configSlotStatus(config)}
        onFile={(file) => void setup.setConfigFile(file)}
        disabled={setup.submitting}
      />
      <div className="flex flex-col gap-2">
        <Label htmlFor={pasteId}>{text('training_setup_paste_label', {})}</Label>
        <Textarea
          id={pasteId}
          value={setup.pasted}
          disabled={setup.submitting}
          onChange={(event) => setup.setPasted(event.target.value)}
          className="field-sizing-fixed h-32 resize-y font-mono text-xs"
        />
        <Button
          type="button"
          variant="outline"
          className="self-start"
          disabled={setup.submitting || setup.pasted.trim() === ''}
          onClick={() => void setup.checkPasted()}
        >
          {text('training_setup_check_paste', {})}
        </Button>
      </div>
      {error !== undefined && (
        <p role="alert" className="text-sm text-destructive">
          {text(error, {})}
        </p>
      )}
      {result !== undefined && (
        <div className="flex flex-col gap-2">
          {result.ok && <TrainingSummary ui={ui} config={result.config} />}
          <ConfigIssueList ui={ui} issues={result.issues} />
          {setup.canFix && (
            <Button type="button" variant="outline" className="self-start" onClick={onFix}>
              {text('training_setup_fix_in_editor', {})}
            </Button>
          )}
        </div>
      )}
    </>
  )
}
