import type { Locator, Page } from '@playwright/test'
import { ConfigEditorPage } from './config-editor-page.ts'
import { CreateSessionPage } from './create-session-page.ts'
import { TrainingPage } from './training-page.ts'
import { TrainingSetupPage } from './training-setup-page.ts'
import { TrainingStatsPage } from './training-stats-page.ts'

/** Page d'accueil (`#/`). */
export class HomePage {
  /** Section « Mes entraînements » (absente tant qu'il n'y a aucun entraînement). */
  readonly trainings: Locator

  private readonly page: Page

  constructor(page: Page) {
    this.page = page
    this.trainings = page.getByRole('region', { name: 'Mes entraînements' })
  }

  /** Carte de l'entraînement `name` dans « Mes entraînements ». */
  trainingCard(name: string): Locator {
    return this.trainings
      .getByRole('listitem')
      .filter({ has: this.page.getByRole('heading', { name, exact: true }) })
  }

  /** Suit le lien « Commencer » de la carte « S’entraîner » et renvoie l'écran de mise en place. */
  async startTraining(): Promise<TrainingSetupPage> {
    await this.page.getByRole('link', { name: 'Commencer' }).click()
    await this.page.getByRole('button', { name: 'C’est parti' }).waitFor()
    return new TrainingSetupPage(this.page)
  }

  /** Suit « Reprendre » sur la carte de l'entraînement `name` et renvoie son écran. */
  async openTraining(name: string): Promise<TrainingPage> {
    await this.trainingCard(name).getByRole('link', { name: 'Reprendre' }).click()
    const training = new TrainingPage(this.page)
    await training.tiles.or(training.question).waitFor()
    return training
  }

  /** Suit « Stats » sur la carte de l'entraînement `name` et renvoie l'écran de stats. */
  async openTrainingStats(name: string): Promise<TrainingStatsPage> {
    await this.trainingCard(name).getByRole('link', { name: 'Stats', exact: true }).click()
    const stats = new TrainingStatsPage(this.page)
    await stats.keyFigures.waitFor()
    return stats
  }

  async goto(): Promise<void> {
    await this.page.goto('#/')
  }

  /** Suit le lien « Créer une session » et renvoie l'écran de création. */
  async createSession(): Promise<CreateSessionPage> {
    await this.page.getByRole('link', { name: 'Créer une session' }).first().click()
    return new CreateSessionPage(this.page)
  }

  /** Suit le lien « Ouvrir l'éditeur » de la carte « Éditer une config ». */
  async openEditor(): Promise<ConfigEditorPage> {
    await this.page.getByRole('link', { name: "Ouvrir l'éditeur" }).click()
    return new ConfigEditorPage(this.page)
  }

  /** Ouvre « Supprimer » dans le menu de la carte de la session et renvoie la modale de confirmation. */
  async openDeleteDialog(sessionName: string): Promise<Locator> {
    await this.page.getByRole('button', { name: `Actions pour « ${sessionName} »` }).click()
    await this.page.getByRole('menuitem', { name: 'Supprimer' }).click()
    return this.page.getByRole('alertdialog')
  }
}
