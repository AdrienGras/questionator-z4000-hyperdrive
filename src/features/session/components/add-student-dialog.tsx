import { useId, useRef, useState, type SubmitEvent } from 'react'
import { IconUserPlus } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { findDuplicate } from '@/domain/passage/selectors'
import type { Session } from '@/domain/session/types'
import type { WriteOutcome } from '@/features/session/hooks/use-passage-actions'
import type { Ui } from '@/lib/i18n/use-ui'

type Names = { lastName: string; firstName: string }

type AddStudentDialogProps = Readonly<{
  ui: Ui
  session: Session
  /** Écriture en cours : verrouille les deux boutons d'envoi (pas le déclencheur). */
  disabled: boolean
  onAdd: (names: Names, options: { activate: boolean }) => Promise<WriteOutcome>
}>

/**
 * Dialogue d'ajout d'un étudiant en cours de session (F13). Succès : fermeture et champs vidés ;
 * échec (`failed`) : le dialogue reste ouvert et affiche `write_error`, seule alerte de l'écran (l'appelant
 * passe `ownError`, motif F30 de `ResetDialog`).
 */
export function AddStudentDialog({ ui, session, disabled, onAdd }: AddStudentDialogProps) {
  const { text } = ui
  const lastNameId = useId()
  const firstNameId = useId()
  const [open, setOpen] = useState(false)
  const [failed, setFailed] = useState(false)
  const [lastName, setLastName] = useState('')
  const [firstName, setFirstName] = useState('')
  // Garde synchrone : les deux boutons n'envoient qu'un appel pendant l'écriture, en plus du
  // verrou de `run` (le second appel, ignoré par `run`, ne doit pas fermer le dialogue).
  const submitting = useRef(false)

  const duplicate = findDuplicate(session, { lastName, firstName })
  const incomplete = lastName.trim() === '' || firstName.trim() === ''
  const blocked = disabled || incomplete

  function reset() {
    setLastName('')
    setFirstName('')
  }

  function handleOpenChange(next: boolean) {
    // Échap et clic extérieur sont ignorés pendant l'écriture : l'erreur doit rester visible.
    if (!next && submitting.current) return
    setFailed(false)
    setOpen(next)
    if (!next) reset()
  }

  async function submit(activate: boolean) {
    if (blocked || submitting.current) return
    submitting.current = true
    setFailed(false)
    let outcome: WriteOutcome
    try {
      // L'écriture ne lève jamais : son issue revient en `WriteOutcome`.
      outcome = await onAdd({ lastName, firstName }, { activate })
    } finally {
      submitting.current = false
    }
    // `ignored` (une autre écriture en vol) : ni fermeture ni alerte, l'utilisateur peut réessayer.
    if (outcome === 'written') handleOpenChange(false)
    else if (outcome === 'failed') setFailed(true)
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    void submit(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button variant="outline" />}>
        <IconUserPlus />
        {text('students_add', {})}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{text('students_add_title', {})}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor={lastNameId}>{text('students_add_last_name', {})}</Label>
            <Input
              id={lastNameId}
              autoComplete="off"
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={firstNameId}>{text('students_add_first_name', {})}</Label>
            <Input
              id={firstNameId}
              autoComplete="off"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
            />
          </div>
          {duplicate !== undefined && (
            <output className="text-sm text-muted-foreground">
              {text('students_add_duplicate', {
                name: `${duplicate.lastName} ${duplicate.firstName}`,
              })}
            </output>
          )}
          {failed && (
            <p role="alert" className="text-sm text-destructive">
              {text('write_error', {})}
            </p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={blocked}
              onClick={() => void submit(true)}
            >
              {text('students_add_and_start', {})}
            </Button>
            <Button type="submit" disabled={blocked}>
              {text('students_add_submit', {})}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
