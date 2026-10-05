import { IconBulb } from '@tabler/icons-react'
import { useId, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { copyText } from '@/lib/clipboard'
import type { Ui } from '@/lib/i18n/use-ui'

type CopyState = 'idle' | 'copied' | 'failed'

/** Prompt à copier dans un LLM : zone en lecture seule, bouton de copie et son résultat. */
export function PromptStep({ ui, prompt }: Readonly<{ ui: Ui; prompt: string }>) {
  const { text } = ui
  const promptId = useId()
  const hintId = useId()
  const [copy, setCopy] = useState<CopyState>('idle')

  async function handleCopy() {
    setCopy((await copyText(prompt)) ? 'copied' : 'failed')
  }

  return (
    <>
      {/* Mis en évidence : un effort de réflexion réduit est la première cause de configs bâclées. */}
      <div
        role="note"
        className="flex max-w-prose gap-3 rounded-lg border border-primary/40 bg-primary/10 px-4 py-3 text-sm"
      >
        <IconBulb aria-hidden="true" className="size-5 shrink-0 text-primary" />
        <p>
          <strong>{text('training_setup_effort_title', {})}</strong>{' '}
          {text('training_setup_effort_body', {})}
        </p>
      </div>
      <label htmlFor={promptId} className="sr-only">
        {text('training_setup_prompt_label', {})}
      </label>
      <Textarea
        id={promptId}
        readOnly
        value={prompt}
        aria-describedby={hintId}
        className="field-sizing-fixed h-48 resize-y font-mono text-xs"
      />
      <p id={hintId} className="max-w-prose text-sm text-muted-foreground">
        {text('training_setup_prompt_hint', {})}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="outline" onClick={() => void handleCopy()}>
          {text('training_setup_copy', {})}
        </Button>
        {/* Toujours montée : une région live n'annonce que les changements d'un élément existant. */}
        <span aria-live="polite" className="text-sm">
          {copy === 'copied' ? text('training_setup_copied', {}) : ''}
        </span>
      </div>
      {copy === 'failed' && (
        <p role="alert" className="text-sm text-destructive">
          {text('training_setup_copy_failed', {})}
        </p>
      )}
    </>
  )
}
