import { fireEvent, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { expect, test, vi } from 'vitest'
import { AppearanceProvider } from '@/app/appearance-provider'
import { bannerInteractiveNames } from '@/testing/page-shell-assertions'
import { PageShell } from './page-shell'

function Harness({
  children,
  ...props
}: Readonly<{ children?: ReactNode } & Omit<React.ComponentProps<typeof PageShell>, 'children'>>) {
  return <PageShell {...props}>{children}</PageShell>
}

function mount(node: ReactNode) {
  return render(<AppearanceProvider>{node}</AppearanceProvider>)
}

test('titre seul : h1, ni retour, ni ligne d’infos, ni actions', () => {
  mount(<Harness title="Oral">x</Harness>)
  const h1 = screen.getByRole('heading', { level: 1, name: 'Oral' })
  expect(h1.parentElement?.children).toHaveLength(1)
  expect(bannerInteractiveNames()).toEqual([])
})

test('retour, infos et actions rendus, dans cet ordre ; plus d’aide dans la barre', () => {
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
  expect(bannerInteractiveNames()).toEqual(['Retour', 'Projeter'])
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
  expect(h1.parentElement).toHaveClass('min-w-0')
  // Le bloc qui se replie porte aussi l'éventuelle tuile d'espace (`icon`).
  expect(h1.parentElement?.parentElement).toHaveClass('flex-[1_1_20rem]', 'min-w-0')
  const actions = screen.getByRole('button', { name: 'Projeter' })
  expect(actions.parentElement).toHaveClass('ml-auto', 'justify-end')
})

test('icon : tuile avant le titre', () => {
  mount(
    <Harness title="Sessions" icon={<span data-testid="tuile" />}>
      x
    </Harness>,
  )
  const h1 = screen.getByRole('heading', { level: 1, name: 'Sessions' })
  const tile = screen.getByTestId('tuile')
  expect(tile.compareDocumentPosition(h1) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
})

test('halo space : un décor caché, sans pointeur ; aucun sans la prop', () => {
  const { unmount } = mount(
    <Harness title="Sessions" halo="space">
      x
    </Harness>,
  )
  const main = screen.getByRole('main')
  const halos = main.querySelectorAll('[aria-hidden="true"].pointer-events-none')
  expect(halos).toHaveLength(1)
  expect(main).toHaveClass('relative', 'isolate', 'overflow-x-clip')
  unmount()
  mount(<Harness title="Oral">x</Harness>)
  expect(screen.getByRole('main').querySelectorAll('.pointer-events-none')).toHaveLength(0)
  expect(screen.getByRole('main')).not.toHaveClass('overflow-x-clip')
})

test('halo home : deux décors', () => {
  mount(
    <Harness title="Accueil" halo="home">
      x
    </Harness>,
  )
  expect(screen.getByRole('main').querySelectorAll('[aria-hidden="true"]')).toHaveLength(2)
})
