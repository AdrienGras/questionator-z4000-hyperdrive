import { useState } from 'react'
import { IconUserCheck, IconUserX } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { Student } from '@/domain/session/types'
import type { WriteOutcome } from '@/features/session/hooks/use-passage-actions'
import type { Ui } from '@/lib/i18n/use-ui'
import { ConfirmWriteDialog } from './confirm-write-dialog'

type AbsentButtonProps = Readonly<{
  ui: Ui
  student: Student
  disabled: boolean
  /** Icône seule, nommée d'après l'étudiant : une par ligne de la liste « Étudiants ». */
  compact?: boolean
  onChange: (
    studentId: string,
    absent: boolean,
    options?: { ownError?: boolean },
  ) => Promise<WriteOutcome>
}>

/**
 * Action « Marquer absent » / « Marquer présent » (F12, F38). Marquer absent un étudiant qui a des
 * questions tirées demande confirmation (`ConfirmWriteDialog`), car l'absence les supprime ; sinon,
 * l'action écrit tout de suite.
 * L'étudiant visé est figé à l'ouverture : si l'étudiant actif change pendant que le dialogue est
 * ouvert (autre onglet), c'est bien celui du dialogue qui est déclaré absent (D67).
 */
export function AbsentButton({
  ui,
  student,
  disabled,
  compact = false,
  onChange,
}: AbsentButtonProps) {
  const { text } = ui
  const [open, setOpen] = useState(false)
  // Figé à l'ouverture : après l'écriture, la liveQuery vide les attempts pendant la fermeture, et
  // l'étudiant actif peut changer pendant que le dialogue est ouvert.
  const [target, setTarget] = useState({ id: student.id, name: '', count: 0 })
  const name = `${student.lastName} ${student.firstName}`
  const markAbsent = !student.absent

  function act() {
    if (markAbsent && student.attempts.length > 0) {
      setTarget({ id: student.id, name, count: student.attempts.length })
      setOpen(true)
      return
    }
    void onChange(student.id, markAbsent)
  }

  const Icon = markAbsent ? IconUserX : IconUserCheck
  const label = text(markAbsent ? 'absent_mark' : 'absent_unmark', {})
  const trigger = compact ? (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={disabled}
            aria-label={text(markAbsent ? 'absent_mark_named' : 'absent_unmark_named', { name })}
            onClick={act}
          />
        }
      >
        <Icon aria-hidden />
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  ) : (
    <Button
      type="button"
      variant="outline"
      className="self-start"
      disabled={disabled}
      onClick={act}
    >
      <Icon aria-hidden />
      {label}
    </Button>
  )

  return (
    <>
      {trigger}
      <ConfirmWriteDialog
        ui={ui}
        title={text('absent_title', { name: target.name })}
        description={text('absent_body', { count: target.count })}
        confirmLabel={text('absent_confirm', {})}
        open={open}
        onOpenChange={setOpen}
        onConfirm={() => onChange(target.id, true, { ownError: true })}
      />
    </>
  )
}
