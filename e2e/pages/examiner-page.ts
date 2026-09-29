import type { Locator, Page } from '@playwright/test'
import { PresentPage } from './present-page.ts'

/** Écran examinateur (`#/session/<id>`). */
export class ExaminerPage {
  /** Rappel « La vue projetée montre … » (rôle `status`), visible quand l'étudiant projeté n'est pas l'actif. */
  readonly banner: Locator

  private readonly page: Page

  constructor(page: Page) {
    this.page = page
    this.banner = page.getByRole('status').filter({ hasText: 'La vue projetée montre' })
  }

  /** Tire une question dans la catégorie (`Normal` pour le bouton « Normal max 2 »). */
  async draw(categoryLabel: string): Promise<void> {
    await this.page
      .getByRole('list', { name: 'Choisir une catégorie' })
      .getByRole('button', { name: new RegExp(String.raw`^${categoryLabel}\b`) })
      .click()
  }

  /** Note la question en cours (`value` : la valeur affichée, ex. « 1 » ou « 0,5 »). */
  async score(value: string): Promise<void> {
    await this.page.getByRole('button', { name: `Noter ${value}`, exact: true }).click()
  }

  /** Saisit le commentaire de l'étudiant actif, puis quitte le champ pour forcer l'enregistrement. */
  async setComment(text: string): Promise<void> {
    const field = this.page.getByRole('textbox', { name: 'Commentaire' })
    await field.fill(text)
    await field.blur()
  }

  /** Ouvre la vue projetée dans une nouvelle fenêtre et renvoie son écran. */
  async openPresentView(): Promise<PresentPage> {
    const [popup] = await Promise.all([
      this.page.waitForEvent('popup'),
      this.page.getByRole('button', { name: 'Ouvrir la vue projetée' }).click(),
    ])
    return new PresentPage(popup)
  }

  async projectActiveStudent(): Promise<void> {
    await this.page.getByRole('button', { name: 'Projeter cet étudiant' }).click()
  }

  async showWaiting(): Promise<void> {
    await this.page.getByRole('button', { name: 'Écran d’attente' }).click()
  }
}
