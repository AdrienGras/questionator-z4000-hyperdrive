import type { Locator, Page } from '@playwright/test'
import { ConfigEditorPage } from './config-editor-page.ts'
import { TrainingPage } from './training-page.ts'

/**
 * Écran de mise en place d'un entraînement (`#/training/new`, F43.3) ou de mise à jour de sa
 * config (`#/training/$trainingId/update`, F43.4).
 */
export class TrainingSetupPage {
  /** Bouton « Corriger dans l’éditeur », présent quand la config chargée est invalide. */
  readonly fixButton: Locator

  /** Bouton « C’est parti », désactivé tant que la config n'est pas valide. */
  readonly submitButton: Locator

  /** Bouton « Mettre à jour », en mise à jour ; désactivé tant que la config n'est pas valide. */
  readonly updateButton: Locator

  /** Liste « Bilan de la mise à jour » : questions conservées, nouvelles, retirées. */
  readonly updateSummary: Locator

  private readonly page: Page

  constructor(page: Page) {
    this.page = page
    this.submitButton = page.getByRole('button', { name: 'C’est parti' })
    this.fixButton = page.getByRole('button', { name: 'Corriger dans l’éditeur' })
    this.updateButton = page.getByRole('button', { name: 'Mettre à jour', exact: true })
    this.updateSummary = page.getByRole('list', { name: 'Bilan de la mise à jour' })
  }

  /** Message d'une issue de validation affichée sous la config. */
  issue(message: string): Locator {
    return this.page.getByText(message)
  }

  /** Colle `text` dans la zone de collage puis lance « Vérifier le JSON collé ». */
  async pasteConfig(text: string): Promise<void> {
    await this.page.getByRole('textbox', { name: '… ou collez le JSON ici' }).fill(text)
    await this.page.getByRole('button', { name: 'Vérifier le JSON collé' }).click()
  }

  /** « C’est parti » : crée l'entraînement et renvoie son écran, une fois les tuiles montées. */
  async start(): Promise<TrainingPage> {
    await this.submitButton.click()
    await this.page.waitForURL(/#\/training\/(?!new)[^/]+$/)
    const training = new TrainingPage(this.page)
    await training.tiles.waitFor()
    return training
  }

  /** « Mettre à jour » : remplace la config et renvoie l'écran d'entraînement, tuiles montées. */
  async update(): Promise<TrainingPage> {
    await this.updateButton.click()
    await this.page.waitForURL(/#\/training\/[^/]+$/)
    const training = new TrainingPage(this.page)
    await training.tiles.waitFor()
    return training
  }

  /** « Corriger dans l’éditeur » : ouvre l'éditeur de config, une fois sa zone de texte montée. */
  async fixInEditor(): Promise<ConfigEditorPage> {
    await this.fixButton.click()
    await this.page.waitForURL(/#\/editor$/)
    const editor = new ConfigEditorPage(this.page)
    await editor.editor.waitFor()
    return editor
  }
}
