import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { readSidePanelTab, writeSidePanelTab } from '@/features/session/side-panel-state'

describe('side-panel-state', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renvoie les défauts sans clé', () => {
    expect(readSidePanelTab()).toBe('student')
  })

  it("écrit puis relit l'onglet", () => {
    writeSidePanelTab('students')
    expect(localStorage.getItem('questionator:side-panel:tab')).toBe('students')
    expect(readSidePanelTab()).toBe('students')
  })

  it('revient au défaut sur une valeur invalide', () => {
    localStorage.setItem('questionator:side-panel:tab', 'autre')
    expect(readSidePanelTab()).toBe('student')
  })

  it('ne lève pas quand le stockage est inaccessible', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('inaccessible')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('inaccessible')
    })
    expect(readSidePanelTab()).toBe('student')
    expect(() => writeSidePanelTab('students')).not.toThrow()
  })
})
