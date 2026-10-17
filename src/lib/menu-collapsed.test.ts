import { afterEach, expect, test, vi } from 'vitest'
import { readMenuCollapsed, writeMenuCollapsed } from './menu-collapsed'

const KEY = 'questionator:menu-collapsed'

afterEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
})

test('rien de stocké : déplié', () => {
  expect(readMenuCollapsed()).toBe(false)
})

test("'true' stocké : replié", () => {
  localStorage.setItem(KEY, 'true')
  expect(readMenuCollapsed()).toBe(true)
})

test('valeur inconnue : déplié', () => {
  localStorage.setItem(KEY, 'oui')
  expect(readMenuCollapsed()).toBe(false)
})

test('lecture qui lève : déplié', () => {
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new Error('bloqué')
  })
  expect(readMenuCollapsed()).toBe(false)
})

test('écriture qui lève : avalée', () => {
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('quota')
  })
  expect(() => writeMenuCollapsed(true)).not.toThrow()
})

test('aller-retour', () => {
  writeMenuCollapsed(true)
  expect(localStorage.getItem(KEY)).toBe('true')
  expect(readMenuCollapsed()).toBe(true)
  writeMenuCollapsed(false)
  expect(readMenuCollapsed()).toBe(false)
})
