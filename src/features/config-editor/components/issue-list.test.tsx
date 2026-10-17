import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { configError, configWarning, formatPath, type ConfigIssue } from '@/domain/config/issues'
import { formatConfigIssue } from '@/domain/config/messages'
import { makeUi } from '@/testing/make-ui'
import { IssueList } from './issue-list'

const ui = makeUi('fr')
const warning = configWarning('unknown_key', ['exam', 'foo'], { key: 'foo' })
const error = configError('required', ['exam', 'title'], {})

describe('IssueList', () => {
  it('en-tête « Problèmes » et compteur', () => {
    render(
      <IssueList
        ui={ui}
        issues={[
          { issue: warning, line: 4 },
          { issue: error, line: 2 },
        ]}
        onSelect={vi.fn<(issue: ConfigIssue) => void>()}
      />,
    )
    expect(screen.getByRole('heading', { level: 2, name: 'Problèmes' })).toBeInTheDocument()
    expect(screen.getByText('1 erreur, 1 avertissement')).toBeInTheDocument()
  })

  it('liste les erreurs avant les avertissements, avec message, chemin et ligne', () => {
    render(
      <IssueList
        ui={ui}
        issues={[
          { issue: warning, line: 115 },
          { issue: error, line: 2 },
        ]}
        onSelect={vi.fn<(issue: ConfigIssue) => void>()}
      />,
    )
    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(2)
    expect(buttons[0]?.textContent).toContain(formatConfigIssue(error, 'fr'))
    expect(buttons[0]?.textContent).toContain(formatPath(error.path))
    expect(buttons[0]?.textContent).toContain('ligne 2')
    expect(buttons[1]?.textContent).toContain(formatConfigIssue(warning, 'fr'))
    expect(buttons[1]?.textContent).toContain('ligne 115')
  })

  it('appelle onSelect avec l’issue cliquée', () => {
    const onSelect = vi.fn<(issue: ConfigIssue) => void>()
    render(<IssueList ui={ui} issues={[{ issue: error, line: 1 }]} onSelect={onSelect} />)
    fireEvent.click(screen.getByRole('button'))
    expect(onSelect).toHaveBeenCalledWith(error)
  })

  it('sans issue : « Aucune erreur », aucune liste', () => {
    render(<IssueList ui={ui} issues={[]} onSelect={vi.fn<(issue: ConfigIssue) => void>()} />)
    expect(screen.getByText('Aucune erreur')).toBeInTheDocument()
    expect(screen.queryByRole('button')).toBeNull()
    expect(screen.queryByRole('list')).toBeNull()
  })
})
