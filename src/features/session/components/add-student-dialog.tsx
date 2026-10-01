import { useId, useRef, useState, type FormEvent } from 'react'
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
import { useFreshError, type Failure } from '@/features/session/hooks/use-fresh-error'
import { findDuplicate } from '@/domain/passage/selectors'
import type { Session } from '@/domain/session/types'
import type { Ui } from '@/lib/i18n/use-ui'

type Names = { lastName: string; firstName: string }

type AddStudentDialogProps = Readonly<{
  ui: Ui
  session: Session
  /** Écriture en cours : verrouille les deux boutons d'envoi (pas le déclencheur). */
  disabled: boolean
  /** Dernière action refusée, montrée ici (seulement si survenue dialogue ouvert) car le `role="alert"` de l'écran est sous le modal. */
  error?: Failure
  onAdd: (names: Names, options: { activate: boolean }) => Promise<boolean>
}>

/**
 * Dialogue d'ajout d'un étudiant en cours de session (F13). Succès : fermeture et champs vidés ;
 * échec : le dialogue reste ouvert et affiche l'erreur reçue en `error`.
 */
export function AddStudentDialog({ ui, session, disabled, error, onAdd }: AddStudentDialogProps) {
  const { text } = ui
  const lastNameId = useId()
  const firstNameId = useId()
  const [open, setOpen] = useState(false)
  const freshError = useFreshError(error, open)
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
    setOpen(next)
    if (!next) reset()
  }

  async function submit(activate: boolean) {
    if (blocked || submitting.current) return
    submitting.current = true
    let succeeded = false
    try {
      // `run` ne lève jamais : un échec revient en `false`.
      succeeded = await onAdd({ lastName, firstName }, { activate })
    } finally {
      submitting.current = false
    }
    if (succeeded) handleOpenChange(false)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
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
          {freshError !== undefined && (
            <p role="alert" className="text-sm text-destructive">
              {freshError.message}
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
