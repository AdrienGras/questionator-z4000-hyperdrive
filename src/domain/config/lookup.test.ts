import { describe, expect, test } from 'vitest'
import { makeConfig } from '@/testing/student-fixtures'
import { categoryLabel, findCategory, questionTitle } from './lookup'

const config = makeConfig({})
const category = config.categories[0]
const question = category?.questions[0]

describe('lookup', () => {
  test('findCategory trouve la catégorie ou renvoie undefined', () => {
    expect(findCategory(config, category?.id ?? '')).toBe(category)
    expect(findCategory(config, 'inconnue')).toBeUndefined()
  })

  test('categoryLabel retombe sur l’id', () => {
    expect(categoryLabel(config, category?.id ?? '')).toBe(category?.label)
    expect(categoryLabel(config, 'inconnue')).toBe('inconnue')
  })

  test('questionTitle retombe sur l’id', () => {
    expect(questionTitle(config, category?.id ?? '', question?.id ?? '')).toBe(question?.title)
    expect(questionTitle(config, category?.id ?? '', 'q-inconnue')).toBe('q-inconnue')
    expect(questionTitle(config, 'inconnue', 'q1')).toBe('q1')
  })
})
