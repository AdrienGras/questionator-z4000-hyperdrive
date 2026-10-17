import type { Download, Locator, Page } from '@playwright/test'
import { PresentPage } from './present-page.ts'
import { StatsPage } from './stats-page.ts'

/** Écran examinateur (`#/session/<id>`). */
export class ExaminerPage {
  /** Rappel « La vue projetée montre … » (rôle `status`), visible quand l'étudiant projeté n'est pas l'actif. */
  readonly banner: Locator

  /** Titre de l'écran de fin de passage. */
  readonly passageDone: Locator

  /** Un jeton de code colorié par Shiki dans la question en cours (région « Question en cours »). */
  readonly highlightedCode: Locator

  /** Tous les blocs de code colorés (`pre` marqué `data-highlighted="true"`). */
  readonly highlightedBlocks: Locator

  /** Un bloc de code resté en texte brut (`data-highlighted="false"`). */
  readonly plainCode: Locator

  /** Champ « Commentaire » de la colonne de droite. */
  readonly commentField: Locator

  /** Statut « Enregistré » visible du commentaire. */
  readonly commentSaved: Locator

  /** Tiroir latéral : le `dialog` qui porte les onglets « Panneau » (nommé par la session). */
  readonly panel: Locator

  private readonly page: Page

  /** Exclut l'aperçu de la vue projetée (F22), qui duplique l'énoncé et ses blocs de code. */
  private static readonly OUTSIDE_PREVIEW = ':not([data-projection-canvas] *)'

  constructor(page: Page) {
    this.page = page
    this.highlightedBlocks = page.locator(
      `pre[data-highlighted="true"]${ExaminerPage.OUTSIDE_PREVIEW}`,
    )
    this.plainCode = page.locator(`pre[data-highlighted="false"]${ExaminerPage.OUTSIDE_PREVIEW}`)
    this.passageDone = page.getByRole('heading', { level: 2, name: 'Passage terminé' })
    // La région est hors de l'aperçu (inerte, `aria-hidden`) : pas besoin d'`OUTSIDE_PREVIEW`.
    this.highlightedCode = page
      .getByRole('region', { name: 'Question en cours' })
      .locator('pre span[style*="--shiki-"]')
      .first()
    this.banner = page.getByRole('status').filter({ hasText: 'La vue projetée montre' })
    this.commentField = page.getByRole('textbox', { name: 'Commentaire' })
    this.commentSaved = page
      .locator('section')
      .filter({ has: this.commentField })
      .getByText('Enregistré', { exact: true })
      .first()
    this.panel = page
      .getByRole('dialog')
      .filter({ has: page.getByRole('tablist', { name: 'Panneau' }) })
  }

  /** Tire une question dans la catégorie (`Normal` pour le bouton « Normal 2 pts »). */
  async draw(categoryLabel: string): Promise<void> {
    await this.page
      .getByRole('list', { name: 'Choisir une catégorie' })
      .getByRole('button', { name: new RegExp(String.raw`^${categoryLabel}\b`) })
      .click()
  }

  /** Choisit un mode d'affichage (« Clair », « Sombre », « Système ») dans le menu de thème. */
  async chooseColorMode(label: string): Promise<void> {
    await this.page.getByRole('button', { name: /^Mode d'affichage/ }).click()
    await this.page.getByRole('menuitemradio', { name: label }).click()
  }

  /** Note la question en cours (`value` : la valeur affichée, ex. « 1 » ou « 0,5 »). */
  async score(value: string): Promise<void> {
    await this.page.getByRole('button', { name: `Noter ${value}`, exact: true }).click()
  }

  /** Saisit le commentaire (colonne de droite) et quitte le champ pour forcer l'enregistrement. */
  async setComment(text: string): Promise<void> {
    await this.commentField.fill(text)
    await this.commentField.blur()
    // Attend l'écriture Dexie (statut visible ; la zone sr-only en porte une copie).
    await this.commentSaved.waitFor()
  }

  /** Saisit le commentaire sans quitter le champ ni attendre l'enregistrement. */
  async typeCommentWithoutSaving(text: string): Promise<void> {
    await this.commentField.fill(text)
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

  /** Valide la boîte « Ajuster la note » qui s'ouvre d'elle-même à la fin du passage (ajustement 0). */
  async confirmAdjustment(): Promise<void> {
    await this.page
      .getByRole('dialog', { name: 'Ajuster la note' })
      .getByRole('button', { name: 'Enregistrer' })
      .click()
  }

  /** Ouvre le tiroir latéral (fermé au chargement) et, si demandé, y choisit un onglet. */
  async openPanel(tab?: 'Cet étudiant' | 'Liste'): Promise<void> {
    await this.page.getByRole('button', { name: 'Panneau', exact: true }).click()
    await this.panel.waitFor()
    if (tab) await this.panel.getByRole('tab', { name: tab, exact: true }).click()
  }

  /** Ouvre l'écran des statistiques (pied du panneau latéral). */
  async openStats(): Promise<StatsPage> {
    await this.openPanel()
    await this.page.getByRole('link', { name: 'Statistiques' }).click()
    return new StatsPage(this.page)
  }

  /** Clique « Exporter en Excel » (pied du panneau) et renvoie le téléchargement déclenché. */
  async exportWorkbook(): Promise<Download> {
    await this.openPanel()
    const [download] = await Promise.all([
      this.page.waitForEvent('download'),
      this.page.getByRole('button', { name: 'Exporter en Excel' }).click(),
    ])
    await this.page.getByRole('button', { name: 'Fermer le panneau' }).click()
    await this.panel.waitFor({ state: 'hidden' })
    return download
  }
}
