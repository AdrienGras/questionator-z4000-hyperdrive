import type { Download, Locator, Page } from '@playwright/test'
import { CreateSessionPage } from './create-session-page.ts'

/**
 * Éditeur de config (`#/editor`, F26). Le texte vit dans CodeMirror : la saisie passe par le
 * clavier dans la zone de texte, et les diagnostics, la ligne active et les numéros de ligne ne
 * s'atteignent que par les classes de CodeMirror (`.cm-*`).
 */
export class ConfigEditorPage {
  /** Zone de texte de CodeMirror (`.cm-content`, rôle `textbox`). */
  readonly editor: Locator

  /** Lignes du texte qui portent un soulignement d'erreur. */
  readonly errorLines: Locator

  /** Ligne du curseur. */
  readonly activeLine: Locator

  /** Numéro de la ligne du curseur, dans la gouttière des numéros. */
  readonly activeLineNumber: Locator

  /** Compteur « Aucune erreur » de la liste des issues. */
  readonly noIssues: Locator

  /** Bandeau « Aperçu périmé » (rôle `status`). */
  readonly staleBanner: Locator

  /** Colonne de l'aperçu (région « Aperçu »). */
  readonly preview: Locator

  /** Cartes des questions de l'aperçu. */
  readonly previewQuestions: Locator

  /** Section « Écran final » de l'aperçu. */
  readonly finalScreen: Locator

  readonly createSessionButton: Locator

  private readonly page: Page

  constructor(page: Page) {
    this.page = page
    this.editor = page.getByRole('textbox', { name: 'Configuration JSON' })
    this.errorLines = page.locator('.cm-line').filter({ has: page.locator('.cm-lintRange-error') })
    this.activeLine = page.locator('.cm-activeLine')
    this.activeLineNumber = page.locator('.cm-lineNumbers .cm-activeLineGutter')
    this.noIssues = page.getByText('Aucune erreur')
    this.staleBanner = page.getByRole('status').filter({ hasText: 'Aperçu périmé' })
    this.preview = page.getByRole('region', { name: 'Aperçu' })
    this.previewQuestions = this.preview.getByRole('article')
    this.finalScreen = this.preview
      .locator('section')
      .filter({ has: page.getByRole('heading', { level: 3, name: 'Écran final' }) })
    this.createSessionButton = page.getByRole('button', {
      name: 'Créer une session avec cette config',
    })
  }

  async goto(): Promise<void> {
    await this.page.goto('#/editor')
  }

  /** Remplace tout le texte de l'éditeur, au clavier (tout sélectionner puis saisir). */
  async replaceText(text: string): Promise<void> {
    await this.editor.click()
    await this.page.keyboard.press('ControlOrMeta+a')
    await this.page.keyboard.insertText(text)
  }

  /** Ouvre la liste de complétion (Ctrl+Espace) ; le focus reste dans l'éditeur. */
  async complete(): Promise<void> {
    await this.page.keyboard.press('Control+Space')
  }

  /** Option de la liste de complétion, désignée par (un extrait de) son libellé. */
  completionOption(name: string | RegExp): Locator {
    return this.page.getByRole('option', { name })
  }

  /** Infobulle de survol (description et défaut). */
  get hoverTooltip(): Locator {
    return this.page.locator('.cm-tooltip-hover')
  }

  /** Bouton d'une issue de la liste, désigné par (un extrait de) son message. */
  issue(message: string): Locator {
    return this.page.getByRole('button', { name: message })
  }

  async selectIssue(message: string): Promise<void> {
    await this.issue(message).click()
  }

  /** Déplie la réponse attendue de la n-ième question de l'aperçu. */
  async expandAnswer(index: number): Promise<void> {
    await this.previewQuestions.nth(index).getByText('Réponse attendue').click()
  }

  async download(): Promise<Download> {
    const [download] = await Promise.all([
      this.page.waitForEvent('download'),
      this.page.getByRole('button', { name: 'Télécharger' }).click(),
    ])
    return download
  }

  /** « Créer une session avec cette config » : mène à l'écran de création. */
  async createSession(): Promise<CreateSessionPage> {
    await this.createSessionButton.click()
    return new CreateSessionPage(this.page)
  }

  async reload(): Promise<void> {
    await this.page.reload()
  }
}
