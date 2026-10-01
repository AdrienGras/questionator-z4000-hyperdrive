import { describe, expect, it } from 'vitest'
import { themeVariables } from './theme-variables'

describe('themeVariables', () => {
  it('préfixe chaque token par -- et ignore les valeurs undefined', () => {
    expect(themeVariables({ primary: 'red', ring: undefined })).toEqual({ '--primary': 'red' })
  })
})
