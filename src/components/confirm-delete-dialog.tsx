import { useState, type ReactNode } from 'react'
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
import type { Ui } from '@/lib/i18n/use-ui'

type ConfirmDeleteDialogProps = Readonly<{
  ui: Ui
  name: string
  body: string
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Suppression ; un rejet affiche `write_error` en ligne et laisse le dialogue ouvert. */
  onConfirm: () => Promise<void>
  /** Bouton supplémentaire placé avant « Annuler » (ex. « Exporter un backup d'abord »). */
  extraAction?: ReactNode
}>

/**
 * Confirmation de suppression « Supprimer « nom » ? ». Pendant l'écriture, ni « Annuler » ni Échap
 * ne ferment le dialogue ; un échec s'affiche en ligne.
 */
export function ConfirmDeleteDialog({
  ui,
  name,
  body,
  open,
  onOpenChange,
  onConfirm,
  extraAction,
}: ConfirmDeleteDialogProps) {
  const { text } = ui
  const [deleting, setDeleting] = useState(false)
  const [failed, setFailed] = useState(false)

  function changeOpen(next: boolean) {
    if (deleting) return
    setFailed(false)
    onOpenChange(next)
  }

  async function confirm() {
    if (deleting) return
    setDeleting(true)
    setFailed(false)
    try {
      await onConfirm()
      setDeleting(false)
      onOpenChange(false)
    } catch {
      setDeleting(false)
      setFailed(true)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={changeOpen}>
      {/* Trois boutons : la largeur du vendor (24 rem) ne les tient pas sur une ligne. Préfixe
          `data-[size=default]:` : sans lui, `sm:max-w-sm` du vendor (sous ce variant) l'emporterait. */}
      <AlertDialogContent
        className={extraAction === undefined ? undefined : 'data-[size=default]:sm:max-w-md'}
      >
        <AlertDialogHeader>
          {/* `wrap-anywhere` : un nom sans espace élargirait la grille de l'en-tête, et la modale avec. */}
          <AlertDialogTitle className="wrap-anywhere">
            {text('delete_title', { name })}
          </AlertDialogTitle>
          <AlertDialogDescription>{body}</AlertDialogDescription>
        </AlertDialogHeader>
        {failed && (
          <p role="alert" className="text-sm text-destructive">
            {text('write_error', {})}
          </p>
        )}
        <AlertDialogFooter>
          {extraAction}
          <AlertDialogCancel disabled={deleting}>{text('dialog_cancel', {})}</AlertDialogCancel>
          <Button variant="destructive" disabled={deleting} onClick={() => void confirm()}>
            {text('delete_confirm', {})}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
