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
  it('liste les erreurs avant les avertissements, avec message et chemin', () => {
    render(
      <IssueList
        ui={ui}
        issues={[warning, error]}
        onSelect={vi.fn<(issue: ConfigIssue) => void>()}
      />,
    )
    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(2)
    expect(buttons[0]?.textContent).toContain(formatConfigIssue(error, 'fr'))
    expect(buttons[0]?.textContent).toContain(formatPath(error.path))
    expect(buttons[1]?.textContent).toContain(formatConfigIssue(warning, 'fr'))
    expect(screen.getByText('1 erreur, 1 avertissement')).toBeTruthy()
  })

  it('appelle onSelect avec l’issue cliquée', () => {
    const onSelect = vi.fn<(issue: ConfigIssue) => void>()
    render(<IssueList ui={ui} issues={[error]} onSelect={onSelect} />)
    fireEvent.click(screen.getByRole('button'))
    expect(onSelect).toHaveBeenCalledWith(error)
  })

  it('sans issue : « Aucune erreur »', () => {
    render(<IssueList ui={ui} issues={[]} onSelect={vi.fn<(issue: ConfigIssue) => void>()} />)
    expect(screen.getByText('Aucune erreur')).toBeTruthy()
    expect(screen.queryByRole('button')).toBeNull()
  })
})
