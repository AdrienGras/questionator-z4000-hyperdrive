import { createEvent, fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'
import { t } from '@/i18n'
import { UI_MESSAGES } from '@/i18n/ui-messages'
import type { Ui } from '@/i18n/use-ui'
import { FileDropField } from './FileDropField'

const ui: Ui = { locale: 'fr', text: (key, params) => t(UI_MESSAGES, 'fr', key, params) }

type Props = Parameters<typeof FileDropField>[0]

function renderField(overrides: Partial<Props> = {}) {
  const onFile = vi.fn<(file: File) => void>()
  const field = (props: Partial<Props>) => (
    <FileDropField
      ui={ui}
      label="Liste d'étudiants (CSV)"
      accept=".csv,text/csv"
      fileName={undefined}
      status="empty"
      onFile={onFile}
      {...props}
    />
  )
  const { container, rerender } = render(field(overrides))
  const input = container.querySelector('input[type=file]')
  if (!(input instanceof HTMLInputElement)) throw new Error('input fichier absent')
  return {
    onFile,
    input,
    zone: screen.getByRole('group', { name: "Liste d'étudiants (CSV)" }),
    rerender: (props: Partial<Props>) => rerender(field(props)),
  }
}

const file = new File(['Nom;Prénom'], 'etudiants.csv', { type: 'text/csv' })

describe('FileDropField', () => {
  test('« Choisir un fichier » ouvre le sélecteur', () => {
    const { input } = renderField()
    const click = vi.spyOn(input, 'click').mockImplementation(() => {})
    fireEvent.click(screen.getByRole('button', { name: 'Choisir un fichier' }))
    expect(click).toHaveBeenCalledOnce()
    expect(input.accept).toBe('.csv,text/csv')
  })

  test('bouton « Remplacer » quand un fichier est présent', () => {
    renderField({ fileName: 'etudiants.csv', status: 'ok' })
    expect(screen.getByRole('button', { name: 'Remplacer' })).toBeInTheDocument()
    expect(screen.getByText('etudiants.csv')).toBeInTheDocument()
  })

  test('le choix d’un fichier appelle onFile et vide l’input', () => {
    const { input, onFile } = renderField()
    fireEvent.change(input, { target: { files: [file] } })
    expect(onFile).toHaveBeenCalledExactlyOnceWith(file)
    expect(input.value).toBe('')
  })

  test('le dépôt appelle onFile avec le premier fichier', () => {
    const { zone, onFile } = renderField()
    const other = new File(['x'], 'autre.csv')
    fireEvent.drop(zone, { dataTransfer: { files: [file, other], types: ['Files'] } })
    expect(onFile).toHaveBeenCalledExactlyOnceWith(file)
  })

  test('survol : bordure active, retirée en quittant la zone', () => {
    const { zone } = renderField()
    const border = zone.parentElement
    fireEvent.dragOver(zone, { dataTransfer: { files: [file], types: ['Files'] } })
    expect(border).toHaveClass('border-dashed', 'border-primary')
    fireEvent.dragLeave(zone, { dataTransfer: { types: ['Files'] } })
    expect(border).not.toHaveClass('border-primary')
  })

  test('désactivé : dragover empêché quand même, dépôt ignoré', () => {
    const { zone, onFile } = renderField({ disabled: true })
    const dragOver = createEvent.dragOver(zone, {
      dataTransfer: { files: [file], types: ['Files'], dropEffect: 'copy' },
    })
    fireEvent(zone, dragOver)
    expect(dragOver.defaultPrevented).toBe(true)
    expect(zone.parentElement).not.toHaveClass('border-primary')
    const drop = createEvent.drop(zone, { dataTransfer: { files: [file], types: ['Files'] } })
    fireEvent(zone, drop)
    expect(drop.defaultPrevented).toBe(true)
    expect(onFile).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Choisir un fichier' })).toBeDisabled()
  })

  test('actif : dragover empêché (sinon le navigateur ouvre le fichier)', () => {
    const { zone } = renderField()
    expect(fireEvent.dragOver(zone, { dataTransfer: { files: [file], types: ['Files'] } })).toBe(
      false,
    )
  })

  test.each([
    ['ok', 'Fichier valide'],
    ['warnings', 'Fichier valide, avec avertissements'],
    ['errors', 'Fichier invalide'],
    ['reading', 'Lecture en cours…'],
  ] as const)('état %s annoncé par un libellé accessible', (status, label) => {
    renderField({ fileName: 'etudiants.csv', status })
    expect(screen.getByText(label)).toHaveClass('sr-only')
  })

  test('région live : le passage de la lecture au résultat est annoncé', () => {
    const { rerender } = renderField({ fileName: 'etudiants.csv', status: 'reading' })
    const live = screen.getByText('Lecture en cours…')
    expect(live).toHaveAttribute('aria-live', 'polite')
    rerender({ fileName: 'etudiants.csv', status: 'errors' })
    expect(live).toHaveTextContent('Fichier invalide')
  })

  test('aucun état annoncé sans fichier', () => {
    renderField()
    expect(screen.queryByText(/^Fichier/)).not.toBeInTheDocument()
  })
})
