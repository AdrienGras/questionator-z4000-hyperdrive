import { IconBulb, IconCopy } from '@tabler/icons-react'
import { useId } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import type { Ui } from '@/lib/i18n/use-ui'
import { cn } from '@/lib/utils'

/** `copied` reste vrai après une première copie réussie ; `failed` décrit le dernier essai. */
export type PromptCopy = { copied: boolean; failed: boolean }

type PromptStepProps = Readonly<{
  ui: Ui
  prompt: string
  copy: PromptCopy
  onCopy: () => void
}>

/** Note d'effort, prompt en lecture seule et indication : en clair, ou dans le repli après copie. */
function PromptBody({ ui, prompt }: Readonly<{ ui: Ui; prompt: string }>) {
  const { text } = ui
  const promptId = useId()
  const hintId = useId()
  return (
    <>
      {/* Mis en évidence : un effort de réflexion réduit est la première cause de configs bâclées. */}
      <div role="note" className="flex gap-3 rounded-md bg-muted px-4 py-3.5 text-sm">
        <IconBulb aria-hidden="true" className="size-5 shrink-0 text-space-editor" />
        <p>
          <strong className="font-semibold">{text('training_setup_effort_title', {})}</strong>{' '}
          <span className="text-muted-foreground">{text('training_setup_effort_body', {})}</span>
        </p>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor={promptId} className="text-small font-semibold">
          {text('training_setup_prompt_label', {})}
        </label>
        <Textarea
          id={promptId}
          readOnly
          rows={9}
          value={prompt}
          aria-describedby={hintId}
          className="field-sizing-fixed resize-y bg-background font-mono text-xs"
        />
        <p id={hintId} className="text-small text-muted-foreground">
          {text('training_setup_prompt_hint', {})}
        </p>
      </div>
    </>
  )
}

/**
 * Prompt à copier dans un LLM (artboards `entrainement-mise-en-place`, `entrainement-mise-a-jour`).
 * Avant la première copie : le prompt en clair puis « Copier le prompt ». Après : « Prompt copié. »,
 * « Copier à nouveau » et le prompt dans un repli « Afficher le prompt », secours d'une copie à la
 * main. Le bouton et la région live gardent leur emplacement (`null` sinon) : ce sont les mêmes
 * nœuds d'une forme à l'autre, le focus reste sur le bouton et le succès est annoncé.
 */
export function PromptStep({ ui, prompt, copy, onCopy }: PromptStepProps) {
  const { text } = ui
  const { copied } = copy
  return (
    <div className="flex flex-col gap-4">
      {copied ? null : <PromptBody ui={ui} prompt={prompt} />}
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant={copied ? 'ghost' : 'default'}
          className={cn(copied && 'text-muted-foreground')}
          onClick={onCopy}
        >
          <IconCopy data-icon="inline-start" aria-hidden="true" />
          {text(copied ? 'training_setup_copy_again' : 'training_setup_copy', {})}
        </Button>
        {/* Toujours montée : une région live n'annonce que les changements d'un élément existant. */}
        <span
          aria-live="polite"
          className={cn('text-sm text-muted-foreground', copied && 'order-first')}
        >
          {copied ? text('training_setup_copied', {}) : ''}
        </span>
      </div>
      {copy.failed && (
        <p role="alert" className="text-sm text-destructive">
          {text('training_setup_copy_failed', {})}
        </p>
      )}
      {copied ? (
        <details>
          <summary className="min-h-11 cursor-pointer text-sm font-semibold text-muted-foreground">
            {text('training_setup_show_prompt', {})}
          </summary>
          <div className="flex flex-col gap-4 pt-2">
            <PromptBody ui={ui} prompt={prompt} />
          </div>
        </details>
      ) : null}
    </div>
  )
}
