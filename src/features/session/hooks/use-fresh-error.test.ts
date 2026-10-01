import { renderHook } from '@testing-library/react'
import { expect, test } from 'vitest'
import { useFreshError } from './use-fresh-error'

type Props = { error: { message: string } | undefined; open: boolean }

function setup(initial: Props) {
  return renderHook((props: Props) => useFreshError(props.error, props.open), {
    initialProps: initial,
  })
}

test('erreur présente à l’ouverture : masquée', () => {
  const a = { message: 'A' }
  const { result, rerender } = setup({ error: a, open: false })
  expect(result.current).toBeUndefined()

  rerender({ error: a, open: true })

  expect(result.current).toBeUndefined()
})

test('nouvelle erreur pendant l’ouverture : affichée', () => {
  const a = { message: 'A' }
  const b = { message: 'B' }
  const { result, rerender } = setup({ error: a, open: true })

  rerender({ error: b, open: true })

  expect(result.current).toBe(b)
})

test('fermeture puis réouverture avec la même erreur : masquée', () => {
  const b = { message: 'B' }
  const { result, rerender } = setup({ error: undefined, open: true })
  rerender({ error: b, open: true })
  expect(result.current).toBe(b)

  rerender({ error: b, open: false })
  expect(result.current).toBeUndefined()
  rerender({ error: b, open: true })

  expect(result.current).toBeUndefined()
})

test('même message qu’avant mais nouvelle occurrence pendant l’ouverture : affichée', () => {
  const first = { message: 'A' }
  const second = { message: 'A' }
  const { result, rerender } = setup({ error: first, open: true })
  expect(result.current).toBeUndefined()

  rerender({ error: second, open: true })

  expect(result.current).toBe(second)
})
