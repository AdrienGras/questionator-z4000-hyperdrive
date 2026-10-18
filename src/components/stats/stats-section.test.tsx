import { render, screen, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { StatsGroup, StatsSection, StatsTable } from './stats-section'

test('StatsSection : région nommée, niveau et taille de titre distincts', () => {
  render(
    <StatsSection title="Notes finales" as="h3" size="h2">
      {() => <p>corps</p>}
    </StatsSection>,
  )
  expect(screen.getByRole('region', { name: 'Notes finales' })).toBeInTheDocument()
  expect(screen.getByRole('heading', { level: 3, name: 'Notes finales' })).toHaveClass('text-h2')
})

test('StatsSection : titre masqué, icône et complément sur sa ligne', () => {
  render(
    <StatsSection title="À revoir" hideTitle icon={<span>!</span>} aside={<span>2 questions</span>}>
      {() => null}
    </StatsSection>,
  )
  const heading = screen.getByRole('heading', { level: 2, name: 'À revoir' })
  expect(heading).toHaveClass('sr-only')
  expect(heading.parentElement).toHaveTextContent('!À revoir2 questions')
})

test('StatsGroup : intertitre en capitales, région nommée', () => {
  render(
    <StatsGroup title="Synthèse">
      <p>corps</p>
    </StatsGroup>,
  )
  expect(screen.getByRole('region', { name: 'Synthèse' })).toBeInTheDocument()
  expect(screen.getByRole('heading', { level: 2, name: 'Synthèse' })).toHaveClass(
    'text-label',
    'uppercase',
  )
})

test('StatsTable : colonne au libellé masqué', () => {
  render(
    <StatsTable
      labelledBy="t"
      columns={[
        { label: 'Question' },
        { label: 'Part', srOnly: true },
        { label: 'Tirages', numeric: true },
      ]}
    >
      <tr>
        <th scope="row">q</th>
        <td>barre</td>
        <td>4</td>
      </tr>
    </StatsTable>,
  )
  const share = screen.getByRole('columnheader', { name: 'Part' })
  expect(within(share).getByText('Part')).toHaveClass('sr-only')
})
