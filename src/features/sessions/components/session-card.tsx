import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { buttonVariants } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { CardActionsMenu } from '@/components/card-actions-menu'
import { DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { useWorkbookExport } from '@/components/export/use-workbook-export'
import { SessionProgress } from '@/components/session-progress'
import { updateSession } from '@/lib/db/sessions'
import type { Session } from '@/domain/session/types'
import type { Ui } from '@/lib/i18n/use-ui'
import { DeleteDialog } from './delete-dialog'
import { exportBackup } from '@/components/export/export-backup'
import { formatDateTime } from '@/lib/format-date'
import { withExaminer } from '@/domain/session/session-edits'
import { TextFieldDialog } from '@/components/text-field-dialog'

type SessionCardProps = Readonly<{
  ui: Ui
  session: Session
}>

type OpenDialog = 'rename' | 'examiner' | 'delete' | null

export function SessionCard({ ui, session }: SessionCardProps) {
  const { locale, text } = ui
  const excel = useWorkbookExport(locale)
  const excelBusy = excel.state === 'busy'
  const [dialog, setDialog] = useState<OpenDialog>(null)
  const updated = text('card_updated', { date: formatDateTime(session.updatedAt, locale) })
  const openChangeFor = (kind: OpenDialog) => (open: boolean) => setDialog(open ? kind : null)

  return (
    <Card className="w-full gap-4">
      <CardHeader>
        <CardTitle>
          {/* `wrap-anywhere` : un nom sans espace coupe au lieu de déborder de la carte (#118). */}
          <h3 className="text-lg font-semibold wrap-anywhere">{session.name}</h3>
        </CardTitle>
        <CardDescription className="text-[13px] leading-[18px]">
          {session.config.exam.title}
        </CardDescription>
        <CardAction>
          <CardActionsMenu label={text('card_actions', { name: session.name })}>
            <DropdownMenuItem onClick={() => setDialog('rename')}>
              {text('action_rename', {})}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setDialog('examiner')}>
              {text('action_edit_examiner', {})}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => exportBackup(session)}>
              {text('action_export', {})}
            </DropdownMenuItem>
            <DropdownMenuItem disabled={excelBusy} onClick={() => void excel.run(session)}>
              {text(excelBusy ? 'export_busy' : 'export_button', {})}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => setDialog('delete')}>
              {text('action_delete', {})}
            </DropdownMenuItem>
          </CardActionsMenu>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        <p className="text-[13px] leading-[18px] text-muted-foreground tabular-nums">
          {session.examiner === undefined
            ? updated
            : `${updated} · ${text('card_examiner', { name: session.examiner })}`}
        </p>
        <SessionProgress ui={ui} session={session} />
        {excel.state === 'failed' && (
          <p role="alert" className="text-sm text-destructive">
            {text('export_error', {})}
          </p>
        )}
        <div className="mt-auto">
          <Link
            to="/session/$sessionId"
            params={{ sessionId: session.id }}
            aria-label={text('card_resume_named', { name: session.name })}
            className={buttonVariants({ variant: 'outline', size: 'sm' })}
          >
            {text('card_resume', {})}
          </Link>
        </div>
      </CardContent>

      <TextFieldDialog
        ui={ui}
        open={dialog === 'rename'}
        onOpenChange={openChangeFor('rename')}
        title={text('rename_title', {})}
        label={text('rename_label', {})}
        initialValue={session.name}
        required
        onSave={(name) => updateSession(session.id, (s) => ({ ...s, name })).then(() => undefined)}
      />
      <TextFieldDialog
        ui={ui}
        open={dialog === 'examiner'}
        onOpenChange={openChangeFor('examiner')}
        title={text('examiner_title', {})}
        label={text('examiner_label', {})}
        hint={text('examiner_hint', {})}
        initialValue={session.examiner ?? ''}
        required={false}
        onSave={(examiner) =>
          updateSession(session.id, (s) => withExaminer(s, examiner)).then(() => undefined)
        }
      />
      <DeleteDialog
        ui={ui}
        sessionId={session.id}
        name={session.name}
        backup={session}
        open={dialog === 'delete'}
        onOpenChange={openChangeFor('delete')}
      />
    </Card>
  )
}
