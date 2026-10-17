import { renderHook } from '@testing-library/react'
import { expect, test } from 'vitest'
import { useRetained } from './use-retained'

test('garde la dernière valeur non nulle quand la valeur repasse à null', () => {
  const first = { name: 'a' }
  const second = { name: 'b' }
  const { result, rerender } = renderHook(({ value }) => useRetained(value), {
    initialProps: { value: null as { name: string } | null },
  })
  expect(result.current).toBeNull()
  rerender({ value: first })
  expect(result.current).toBe(first)
  rerender({ value: null })
  expect(result.current).toBe(first)
  rerender({ value: second })
  expect(result.current).toBe(second)
  rerender({ value: null })
  expect(result.current).toBe(second)
})
