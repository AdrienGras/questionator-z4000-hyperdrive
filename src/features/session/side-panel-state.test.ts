import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  readSidePanelOpen,
  readSidePanelTab,
  writeSidePanelOpen,
  writeSidePanelTab,
} from '@/features/session/side-panel-state'

describe('side-panel-state', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renvoie les défauts sans clé', () => {
    expect(readSidePanelOpen()).toBe(true)
    expect(readSidePanelTab()).toBe('student')
  })

  it("écrit puis relit l'ouverture", () => {
    writeSidePanelOpen(false)
    expect(localStorage.getItem('questionator:side-panel:open')).toBe('false')
    expect(readSidePanelOpen()).toBe(false)
    writeSidePanelOpen(true)
    expect(localStorage.getItem('questionator:side-panel:open')).toBe('true')
    expect(readSidePanelOpen()).toBe(true)
  })

  it("écrit puis relit l'onglet", () => {
    writeSidePanelTab('students')
    expect(localStorage.getItem('questionator:side-panel:tab')).toBe('students')
    expect(readSidePanelTab()).toBe('students')
  })

  it('revient au défaut sur une valeur invalide', () => {
    localStorage.setItem('questionator:side-panel:open', 'peut-être')
    localStorage.setItem('questionator:side-panel:tab', 'autre')
    expect(readSidePanelOpen()).toBe(true)
    expect(readSidePanelTab()).toBe('student')
  })

  it('ne lève pas quand le stockage est inaccessible', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('inaccessible')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('inaccessible')
    })
    expect(readSidePanelOpen()).toBe(true)
    expect(readSidePanelTab()).toBe('student')
    expect(() => writeSidePanelOpen(false)).not.toThrow()
    expect(() => writeSidePanelTab('students')).not.toThrow()
  })
})
