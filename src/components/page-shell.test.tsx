import { fireEvent, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { expect, test, vi } from 'vitest'
import { AppearanceProvider } from '@/app/appearance-provider'
import { useUi } from '@/lib/i18n/use-ui'
import { bannerInteractiveNames, expectColorModeToggleLast } from '@/testing/page-shell-assertions'
import { PageShell } from './page-shell'

function Harness({
  children,
  ...props
}: Readonly<
  { children?: ReactNode } & Omit<React.ComponentProps<typeof PageShell>, 'ui' | 'children'>
>) {
  return (
    <PageShell ui={useUi()} {...props}>
      {children}
    </PageShell>
  )
}

function mount(node: ReactNode) {
  return render(<AppearanceProvider>{node}</AppearanceProvider>)
}

test('titre seul : h1, pas de retour ni de ligne d’infos, thème dernier', () => {
  mount(<Harness title="Oral">x</Harness>)
  const h1 = screen.getByRole('heading', { level: 1, name: 'Oral' })
  expect(h1.parentElement?.children).toHaveLength(1)
  expectColorModeToggleLast()
})

test('retour, infos et actions rendus ; thème après les actions', () => {
  mount(
    <Harness
      title="Oral"
      back={<a href="#/">Retour</a>}
      meta={<span>Durand Alice</span>}
      actions={<button type="button">Projeter</button>}
    >
      x
    </Harness>,
  )
  expect(screen.getByText('Retour')).toBeInTheDocument()
  expect(screen.getByText('Durand Alice')).toBeInTheDocument()
  expect(screen.getByText('Projeter')).toBeInTheDocument()
  const names = bannerInteractiveNames()
  expect(names.slice(0, 2)).toEqual(['Retour', 'Projeter'])
  expect(names).toHaveLength(3)
  expectColorModeToggleLast()
})

test('props du main transmises', () => {
  const spy = vi.fn<() => void>()
  mount(
    <Harness title="Oral" onDrop={spy} className="extra">
      x
    </Harness>,
  )
  const main = screen.getByRole('main')
  fireEvent.drop(main)
  expect(spy).toHaveBeenCalledTimes(1)
  expect(main).toHaveClass('extra', 'max-w-(--breakpoint-2xl)')
})

test('contenu rendu après la barre', () => {
  mount(
    <Harness title="Oral">
      <p>Contenu</p>
    </Harness>,
  )
  const p = screen.getByText('Contenu')
  expect(screen.getByRole('main')).toContainElement(p)
  expect(screen.getByRole('banner')).not.toContainElement(p)
})

test('titre long : le bloc titre se replie, le groupe de droite reste aligné à droite', () => {
  mount(
    <Harness
      title={'Examen de fin de semestre '.repeat(4)}
      actions={<button type="button">Projeter</button>}
    >
      x
    </Harness>,
  )
  // jsdom ne fait pas de mise en page : on fige les classes qui la portent.
  const h1 = screen.getByRole('heading', { level: 1 })
  expect(h1.parentElement).toHaveClass('flex-[1_1_20rem]', 'min-w-0')
  const toggle = screen.getByRole('button', { name: /^(Mode d'affichage|Display mode)/ })
  expect(toggle.parentElement).toHaveClass('ml-auto', 'justify-end')
})
