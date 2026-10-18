import type { Locator, Page } from '@playwright/test'
import { ExaminerPage } from './examiner-page.ts'

/** Écran des statistiques de session (`#/session/<id>/stats`). */
export class StatsPage {
  /** Phrase de l'histogramme pour les lecteurs d'écran (le dessin est caché), carte « Notes finales ». */
  readonly histogram: Locator

  /** État vide global : aucun étudiant n'a encore de tentative. */
  readonly emptyState: Locator

  private readonly page: Page

  constructor(page: Page) {
    this.page = page
    this.histogram = page.getByRole('region', { name: 'Notes finales' }).getByText(/^Notes? de/)
    this.emptyState = page.getByRole('region', { name: 'Pas encore de statistiques' })
  }

  /** Valeur (`dd`) du chiffre clé de libellé `label` (ex. « Passés »). */
  headcount(label: string): Locator {
    // Le `dd` qui suit immédiatement le `dt` du libellé, sans dépendre de l'imbrication des `div`.
    return this.page
      .getByRole('region', { name: 'Chiffres clés' })
      .getByRole('term')
      .filter({ hasText: new RegExp(`^${label}$`) })
      .locator('xpath=following-sibling::dd[1]')
  }

  /** Retour à l'écran de passage. */
  async backToPassage(): Promise<ExaminerPage> {
    await this.page.getByRole('link', { name: 'Retour au passage' }).click()
    return new ExaminerPage(this.page)
  }

  /** « Aller au passage » de l'état vide. */
  async goToPassage(): Promise<ExaminerPage> {
    await this.emptyState.getByRole('link', { name: 'Aller au passage' }).click()
    return new ExaminerPage(this.page)
  }
}
