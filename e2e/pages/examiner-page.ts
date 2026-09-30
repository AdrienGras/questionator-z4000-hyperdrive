import type { Download, Locator, Page } from '@playwright/test'
import { PresentPage } from './present-page.ts'
import { StatsPage } from './stats-page.ts'

/** Écran examinateur (`#/session/<id>`). */
export class ExaminerPage {
  /** Rappel « La vue projetée montre … » (rôle `status`), visible quand l'étudiant projeté n'est pas l'actif. */
  readonly banner: Locator

  /** Titre de l'écran de fin de passage. */
  readonly passageDone: Locator

  /** Un jeton de code colorié par Shiki (`span` aux variables `--shiki-*` dans un `pre`). */
  readonly highlightedCode: Locator

  /** Tous les blocs de code colorés (`pre` marqué `data-highlighted="true"`). */
  readonly highlightedBlocks: Locator

  /** Un bloc de code resté en texte brut (`data-highlighted="false"`). */
  readonly plainCode: Locator

  private readonly page: Page

  constructor(page: Page) {
    this.page = page
    this.highlightedBlocks = page.locator('pre[data-highlighted="true"]')
    this.plainCode = page.locator('pre[data-highlighted="false"]')
    this.passageDone = page.getByRole('heading', { level: 2, name: 'Passage terminé' })
    this.highlightedCode = page.locator('pre span[style*="--shiki-"]').first()
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

  /** Saisit le commentaire (onglet « Étudiant » du tiroir), quitte le champ pour forcer l'enregistrement, puis referme le tiroir. */
  async setComment(text: string): Promise<void> {
    await this.openPanel('Étudiant')
    const field = this.page.getByRole('textbox', { name: 'Commentaire' })
    await field.fill(text)
    await field.blur()
    await this.page.getByRole('button', { name: 'Fermer le panneau' }).click()
    await this.page.getByRole('dialog', { name: 'Panneau latéral' }).waitFor({ state: 'hidden' })
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

  /** Ouvre le tiroir « Panneau latéral » (fermé au chargement) et, si demandé, y choisit un onglet. */
  async openPanel(tab?: 'Étudiant' | 'Étudiants'): Promise<void> {
    await this.page.getByRole('button', { name: 'Panneau', exact: true }).click()
    await this.page.getByRole('dialog', { name: 'Panneau latéral' }).waitFor()
    if (tab) await this.page.getByRole('tab', { name: tab, exact: true }).click()
  }

  /** Ouvre l'écran des statistiques (bouton de l'onglet « Étudiants » du panneau latéral). */
  async openStats(): Promise<StatsPage> {
    await this.openPanel('Étudiants')
    await this.page.getByRole('link', { name: 'Statistiques' }).click()
    return new StatsPage(this.page)
  }

  /** Clique « Exporter en Excel » (onglet « Étudiants ») et renvoie le téléchargement déclenché. */
  async exportWorkbook(): Promise<Download> {
    await this.openPanel('Étudiants')
    const [download] = await Promise.all([
      this.page.waitForEvent('download'),
      this.page.getByRole('button', { name: 'Exporter en Excel' }).click(),
    ])
    return download
  }
}
