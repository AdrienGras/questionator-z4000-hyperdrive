import { expect, test } from 'vitest'
import { cn } from '@/lib/utils'

test('cn fusionne les classes et résout les conflits Tailwind', () => {
  expect(cn('px-2', 'px-4', undefined, 'text-sm')).toBe('px-4 text-sm')
})
