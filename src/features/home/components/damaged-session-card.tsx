import { useState } from 'react'
import { exportBackup } from '@/components/export/export-backup'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CardActionsMenu } from '@/components/card-actions-menu'
import { DamagedBadge } from '@/components/damaged-badge'
import { DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
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
          <h3 className="text-lg font-semibold wrap-anywhere">{name}</h3>
          <DamagedBadge ui={ui} />
        </CardTitle>
        <CardAction>
          <CardActionsMenu label={text('card_actions', { name })}>
            <DropdownMenuItem onClick={() => exportBackup(damaged.raw)}>
              {text('action_export', {})}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => setDeleting(true)}>
              {text('action_delete', {})}
            </DropdownMenuItem>
          </CardActionsMenu>
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
