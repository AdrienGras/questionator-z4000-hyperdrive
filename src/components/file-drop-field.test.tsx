import { createEvent, fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'
import { t } from '@/lib/i18n/i18n'
import { UI_MESSAGES } from '@/lib/i18n/ui-messages'
import type { Ui } from '@/lib/i18n/use-ui'
import { FileDropField } from './file-drop-field'

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
    box: () => {
      const box = container.querySelector('[data-status]')
      if (!(box instanceof HTMLElement)) throw new Error('zone de dépôt absente')
      return box
    },
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
    const { zone, box } = renderField()
    const border = box()
    fireEvent.dragOver(zone, { dataTransfer: { files: [file], types: ['Files'] } })
    expect(border).toHaveClass('border-dashed', 'border-primary')
    fireEvent.dragLeave(zone, { dataTransfer: { types: ['Files'] } })
    expect(border).not.toHaveClass('border-primary')
  })

  test('désactivé : dragover empêché quand même, dépôt ignoré', () => {
    const { zone, box, onFile } = renderField({ disabled: true })
    const dragOver = createEvent.dragOver(zone, {
      dataTransfer: { files: [file], types: ['Files'], dropEffect: 'copy' },
    })
    fireEvent(zone, dragOver)
    expect(dragOver.defaultPrevented).toBe(true)
    expect(box()).not.toHaveClass('border-primary')
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
  ] as const)('état %s visible et annoncé : un seul nœud', (status, label) => {
    renderField({ fileName: 'etudiants.csv', status })
    const nodes = screen.getAllByText(label)
    expect(nodes).toHaveLength(1)
    expect(nodes[0]).toHaveAttribute('aria-live', 'polite')
    expect(nodes[0]).not.toHaveClass('sr-only')
  })

  test.each([
    ['empty', ['border-dashed', 'border-input']],
    ['reading', ['border-input']],
    ['ok', ['border-space-training']],
    ['warnings', ['border-muted-foreground']],
    ['errors', ['border-destructive']],
  ] as const)('bordure selon l’état %s', (status, classes) => {
    const { box } = renderField({
      fileName: status === 'empty' ? undefined : 'etudiants.csv',
      status,
    })
    expect(box()).toHaveAttribute('data-status', status)
    expect(box()).toHaveClass(...classes)
  })

  test('vide : aucun nom, aucun état, bouton « Choisir un fichier »', () => {
    renderField()
    expect(screen.queryByRole('strong')).not.toBeInTheDocument()
    expect(screen.queryByText(/^Fichier|^Lecture/)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Choisir un fichier' })).toBeInTheDocument()
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

describe('FileDropField compact', () => {
  test('vide : texte d’invite et « Choisir un fichier », sans l’indication du grand format', () => {
    renderField({ size: 'compact', emptyHint: 'Déposez la config (.json) ici' })
    expect(screen.getByText('Déposez la config (.json) ici')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Choisir un fichier' })).toBeInTheDocument()
    expect(screen.queryByText('ou déposez-le ici')).not.toBeInTheDocument()
  })

  test('rempli : nom, état annoncé, « ou déposez-en un autre » et « Remplacer »', () => {
    renderField({ size: 'compact', fileName: 'revisions.json', status: 'ok' })
    expect(screen.getByText('revisions.json')).toBeInTheDocument()
    expect(screen.getByText('ou déposez-en un autre')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Remplacer' })).toBeInTheDocument()
    expect(screen.getByText('Fichier valide')).toHaveAttribute('aria-live', 'polite')
    expect(screen.getByText("Liste d'étudiants (CSV)").tagName).toBe('LEGEND')
  })

  test('un dépôt de fichier appelle onFile', () => {
    const { zone, onFile } = renderField({ size: 'compact' })
    fireEvent.drop(zone, { dataTransfer: { files: [file], types: ['Files'] } })
    expect(onFile).toHaveBeenCalledExactlyOnceWith(file)
  })
})
