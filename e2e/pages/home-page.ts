import type { Locator, Page } from '@playwright/test'
import { ConfigEditorPage } from './config-editor-page.ts'
import { CreateSessionPage } from './create-session-page.ts'
import { TrainingPage } from './training-page.ts'
import { TrainingSetupPage } from './training-setup-page.ts'
import { TrainingStatsPage } from './training-stats-page.ts'

/** Accueil (`#/`) : premier lancement sur base vide, tableau de bord sinon (#147). */
export class HomePage {
  /** Section « Votre premier oral en trois étapes » (base vide seulement). */
  readonly firstRun: Locator
  /** Section « Reprendre » : les trois éléments les plus récents. */
  readonly resume: Locator
  /** Section « Espaces » : une tuile par espace. */
  readonly spaces: Locator

  private readonly page: Page
  private readonly main: Locator

  constructor(page: Page) {
    this.page = page
    this.main = page.getByRole('main')
    this.firstRun = page.getByRole('region', { name: 'Votre premier oral en trois étapes' })
    this.resume = page.getByRole('region', { name: 'Reprendre' })
    this.spaces = page.getByRole('region', { name: 'Espaces' })
  }

  async goto(): Promise<void> {
    await this.page.goto('#/')
  }

  /** Carte de l'entraînement ou de la session `name` dans « Reprendre ». */
  resumeCard(name: string): Locator {
    return this.resume
      .getByRole('article')
      .filter({ has: this.page.getByRole('heading', { name, exact: true }) })
  }

  /** Tuile de l'espace dont le nom contient `name` (« Sessions », « Entraînements »…). */
  spaceTile(name: string): Locator {
    return this.spaces.getByRole('link', { name: new RegExp(name) })
  }

  /** Suit le premier lien « Créer une session » de la page et renvoie l'écran de création. */
  async createSession(): Promise<CreateSessionPage> {
    await this.main.getByRole('link', { name: 'Créer une session' }).first().click()
    return new CreateSessionPage(this.page)
  }

  /** Suit « S’entraîner » (tableau de bord) ou « S’entraîner seul » (premier lancement). */
  async startTraining(): Promise<TrainingSetupPage> {
    await this.main
      .getByRole('link', { name: /^S’entraîner/ })
      .first()
      .click()
    await this.page.getByRole('button', { name: 'C’est parti' }).waitFor()
    return new TrainingSetupPage(this.page)
  }

  /** Suit la tuile « Éditeur de config » ou le lien « Écrire une config dans l’éditeur ». */
  async openEditor(): Promise<ConfigEditorPage> {
    await this.main
      .getByRole('link', { name: /Éditeur de config|Écrire une config dans l’éditeur/ })
      .first()
      .click()
    return new ConfigEditorPage(this.page)
  }

  /** Suit « Reprendre » sur la carte de l'entraînement `name` dans « Reprendre ». */
  async openTraining(name: string): Promise<TrainingPage> {
    await this.resumeCard(name)
      .getByRole('link', { name: /^Reprendre/ })
      .click()
    const training = new TrainingPage(this.page)
    await training.tiles.or(training.question).waitFor()
    return training
  }

  /** Suit « Stats » sur la carte de l'entraînement `name` dans « Reprendre ». */
  async openTrainingStats(name: string): Promise<TrainingStatsPage> {
    await this.resumeCard(name).getByRole('link', { name: 'Stats', exact: true }).click()
    const stats = new TrainingStatsPage(this.page)
    await stats.keyFigures.waitFor()
    return stats
  }
}
