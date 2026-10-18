import { render, screen, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { configError, configWarning } from '@/domain/config/issues'
import { t } from '@/lib/i18n/i18n'
import { UI_MESSAGES } from '@/lib/i18n/ui-messages'
import type { Ui } from '@/lib/i18n/use-ui'
import { ConfigIssueList } from './config-issue-list'

const ui: Ui = { locale: 'fr', text: (key, params) => t(UI_MESSAGES, 'fr', key, params) }

const error = configError('duplicate_question_id', ['categories', 1, 'questions', 3, 'id'], {
  id: 'normal-003',
  firstPath: 'categories[1].questions[2].id',
})
const warning = configWarning('unknown_icon', ['categories', 0, 'icon'], { icon: 'leafs' })

test('erreur : libellé « Erreur », chemin, message', () => {
  render(<ConfigIssueList ui={ui} issues={[error]} />)
  const item = screen.getByRole('listitem')
  expect(within(item).getByText('Erreur')).toBeInTheDocument()
  expect(within(item).getByText('categories[1].questions[3].id')).toBeInTheDocument()
  expect(item).toHaveTextContent('normal-003')
})

test('avertissement : icône et chemin, sans libellé « Erreur »', () => {
  const { container } = render(<ConfigIssueList ui={ui} issues={[warning]} />)
  const item = screen.getByRole('listitem')
  expect(within(item).queryByText('Erreur')).not.toBeInTheDocument()
  expect(within(item).getByText('categories[0].icon')).toBeInTheDocument()
  expect(item).toHaveTextContent('leafs')
  expect(container.querySelector('svg[aria-hidden="true"]')).not.toBeNull()
})

test('erreurs d’abord, rien sans issue', () => {
  const { rerender, container } = render(<ConfigIssueList ui={ui} issues={[warning, error]} />)
  const items = screen.getAllByRole('listitem')
  expect(items[0]).toHaveTextContent('Erreur')
  expect(items[1]).toHaveTextContent('leafs')
  rerender(<ConfigIssueList ui={ui} issues={[]} />)
  expect(container).toBeEmptyDOMElement()
})
