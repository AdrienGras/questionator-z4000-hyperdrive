import { IconDots } from '@tabler/icons-react'
import { useState } from 'react'
import { exportBackup } from '@/components/export/export-backup'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { damagedName, type DamagedSession } from '@/lib/db/damaged-session'
import type { Ui } from '@/lib/i18n/use-ui'
import { DeleteDialog } from './delete-dialog'

type DamagedSessionCardProps = Readonly<{ ui: Ui; damaged: DamagedSession }>

/** Carte d'une session illisible : ni reprise ni progression, seulement export et suppression. */
export function DamagedSessionCard({ ui, damaged }: DamagedSessionCardProps) {
  const { text } = ui
  const [deleting, setDeleting] = useState(false)
  const name = damagedName(damaged)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2">
          <h3 className="text-lg font-semibold">{name}</h3>
          <span className="rounded-full border border-destructive/40 bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
            {text('damaged_badge', {})}
          </span>
        </CardTitle>
        <CardAction>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="icon" aria-label={text('card_actions', { name })} />
              }
            >
              <IconDots />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-auto">
              <DropdownMenuItem onClick={() => exportBackup(damaged.raw)}>
                {text('action_export', {})}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={() => setDeleting(true)}>
                {text('action_delete', {})}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardAction>
      </CardHeader>
      <CardContent className="text-sm">
        <p>{text('damaged_body', {})}</p>
      </CardContent>
      <DeleteDialog
        ui={ui}
        sessionId={damaged.id}
        name={name}
        backup={damaged.raw}
        open={deleting}
        onOpenChange={setDeleting}
      />
    </Card>
  )
}
