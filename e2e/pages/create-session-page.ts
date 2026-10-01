import type { Locator, Page } from '@playwright/test'
import { ExaminerPage } from './examiner-page.ts'

/** Écran de création de session (`#/new`). */
export class CreateSessionPage {
  /** Groupe « Configuration (JSON) » : nom du fichier chargé, statut et issues de validation. */
  readonly configField: Locator

  private readonly page: Page

  constructor(page: Page) {
    this.page = page
    this.configField = page.getByRole('group', { name: 'Configuration (JSON)' })
  }

  async uploadStudents(path: string): Promise<void> {
    await this.upload("Liste d'étudiants (CSV)", path)
  }

  async uploadConfig(path: string): Promise<void> {
    await this.upload('Configuration (JSON)', path)
    // La validation est asynchrone et pré-remplit le nom si personne ne l'a édité : attendre
    // qu'elle ait fini (les deux fichiers valides), sinon `fillName` court contre elle.
    await this.page.getByText('Fichier valide').nth(1).waitFor()
  }

  /** Charge une config donnée par son texte, sans attendre qu'elle soit valide. */
  async uploadConfigText(fileName: string, text: string): Promise<void> {
    const chooser = this.page.waitForEvent('filechooser')
    await this.configField.getByRole('button', { name: 'Choisir un fichier' }).click()
    await (
      await chooser
    ).setFiles({ name: fileName, mimeType: 'application/json', buffer: Buffer.from(text) })
  }

  async fillName(name: string): Promise<void> {
    await this.page.getByRole('textbox', { name: 'Nom de la session' }).fill(name)
  }

  /** Crée la session et renvoie l'écran examinateur sur lequel l'application redirige. */
  async submit(): Promise<ExaminerPage> {
    await this.page.getByRole('button', { name: 'Créer la session' }).click()
    return new ExaminerPage(this.page)
  }

  /** L'`input` est masqué : on passe par le bouton « Choisir un fichier » du groupe et son sélecteur de fichier. */
  private async upload(groupName: string, path: string): Promise<void> {
    const chooser = this.page.waitForEvent('filechooser')
    await this.page
      .getByRole('group', { name: groupName })
      .getByRole('button', { name: 'Choisir un fichier' })
      .click()
    await (await chooser).setFiles(path)
  }
}
