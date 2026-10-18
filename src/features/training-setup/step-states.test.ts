import { expect, test } from 'vitest'
import { setupStepStates } from './step-states'

test('au départ : 1 faite, 2 en cours, 3 et 4 à venir', () => {
  expect(setupStepStates({ copied: false, configChosen: false })).toEqual([
    'done',
    'current',
    'upcoming',
    'upcoming',
  ])
})

test('après copie : 1 à 3 faites, 4 en cours', () => {
  expect(setupStepStates({ copied: true, configChosen: false })).toEqual([
    'done',
    'done',
    'done',
    'current',
  ])
})

test('config déposée sans copie : 4 en cours', () => {
  expect(setupStepStates({ copied: false, configChosen: true })).toEqual([
    'done',
    'done',
    'done',
    'current',
  ])
})
