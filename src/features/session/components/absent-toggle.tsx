import { useId, useState } from 'react'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import type { Student } from '@/domain/session/types'
import type { Ui } from '@/lib/i18n/use-ui'

type AbsentToggleProps = Readonly<{
  ui: Ui
  student: Student
  disabled: boolean
  onChange: (studentId: string, absent: boolean) => Promise<boolean>
}>

/**
 * Case « Absent » (F12). Cocher un étudiant qui a des questions tirées demande confirmation, car
 * l'absence les supprime ; sinon, cocher comme décocher écrit tout de suite. Dialogue au motif
 * F11 (`ResetDialog`) : échec → `write_error` dans le dialogue, rien ne ferme pendant l'écriture.
 * L'étudiant visé est figé à l'ouverture : si l'étudiant actif change pendant que le dialogue est
 * ouvert (autre onglet), c'est bien celui du dialogue qui est déclaré absent (D67).
 */
export function AbsentToggle({ ui, student, disabled, onChange }: AbsentToggleProps) {
  const { text } = ui
  const id = useId()
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const [failed, setFailed] = useState(false)
  // Figé à l'ouverture : après l'écriture, la liveQuery vide les attempts pendant la fermeture, et
  // l'étudiant actif peut changer pendant que le dialogue est ouvert.
  const [target, setTarget] = useState({ id: student.id, name: '', count: 0 })

  function toggle(absent: boolean) {
    if (absent && student.attempts.length > 0) {
      setTarget({
        id: student.id,
        name: `${student.lastName} ${student.firstName}`,
        count: student.attempts.length,
      })
      setFailed(false)
      setOpen(true)
      return
    }
    void onChange(student.id, absent)
  }

  function changeOpen(next: boolean) {
    if (pending) return
    setFailed(false)
    setOpen(next)
  }

  async function confirm() {
    if (pending) return
    setPending(true)
    setFailed(false)
    const succeeded = await onChange(target.id, true)
    setPending(false)
    if (succeeded) setOpen(false)
    else setFailed(true)
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="checkbox"
          className="size-4 accent-primary disabled:cursor-not-allowed disabled:opacity-50"
          checked={student.absent}
          disabled={disabled}
          onChange={(event) => toggle(event.target.checked)}
        />
        <Label htmlFor={id}>{text('absent_label', {})}</Label>
      </div>
      <AlertDialog open={open} onOpenChange={changeOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{text('absent_title', { name: target.name })}</AlertDialogTitle>
            <AlertDialogDescription>
              {text('absent_body', { count: target.count })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {failed && (
            <p role="alert" className="text-sm text-destructive">
              {text('write_error', {})}
            </p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>{text('dialog_cancel', {})}</AlertDialogCancel>
            <Button variant="destructive" disabled={pending} onClick={() => void confirm()}>
              {text('absent_confirm', {})}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
