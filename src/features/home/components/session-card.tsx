import { IconDots } from '@tabler/icons-react'
import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useWorkbookExport } from '@/components/export/use-workbook-export'
import { Progress } from '@/components/ui/progress'
import { updateSession } from '@/lib/db/sessions'
import type { Session } from '@/domain/session/types'
import type { Ui } from '@/lib/i18n/use-ui'
import { DeleteDialog } from './delete-dialog'
import { exportBackup } from '@/components/export/export-backup'
import { formatDateTime } from '@/lib/format-date'
import { sessionProgress } from '@/domain/session/progress'
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
  const { done, absent, remaining, total } = sessionProgress(session)
  const progressText = text('card_progress', { done, absent, remaining })
  const openChangeFor = (kind: OpenDialog) => (open: boolean) => setDialog(open ? kind : null)

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {/* `wrap-anywhere` : un nom sans espace coupe au lieu de déborder de la carte (#118). */}
          <h3 className="text-lg font-semibold wrap-anywhere">{session.name}</h3>
        </CardTitle>
        <CardDescription>{session.config.exam.title}</CardDescription>
        <CardAction>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={text('card_actions', { name: session.name })}
                />
              }
            >
              <IconDots />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-auto">
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
            </DropdownMenuContent>
          </DropdownMenu>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 text-sm">
        {session.examiner !== undefined && (
          <p>{text('card_examiner', { name: session.examiner })}</p>
        )}
        <p className="text-muted-foreground">
          {text('card_updated', { date: formatDateTime(session.updatedAt, locale) })}
        </p>
        <Progress value={total === 0 ? 0 : (done / total) * 100} aria-label={progressText} />
        <p>{progressText}</p>
        {excel.state === 'failed' && (
          <p role="alert" className="text-sm text-destructive">
            {text('export_error', {})}
          </p>
        )}
      </CardContent>
      <CardFooter>
        <Link
          to="/session/$sessionId"
          params={{ sessionId: session.id }}
          className={buttonVariants({ variant: 'outline' })}
        >
          {text('card_resume', {})}
        </Link>
      </CardFooter>

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
