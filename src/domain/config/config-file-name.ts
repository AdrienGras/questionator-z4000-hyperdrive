import { parseJson } from '@/domain/config/parse-json'
import { slugify } from '@/domain/session/file-name'

const FALLBACK_NAME = 'config'

/**
 * Nom du fichier d'une config téléchargée ou passée à la création : `<slug de exam.title>.json`,
 * sinon `config.json` (texte qui ne se parse pas, `exam` ou titre absent, titre vide ou sans aucun
 * caractère retenu par le slug). Lecture tolérante : la config n'a pas besoin d'être valide, seul
 * le titre compte. Le BOM est accepté comme à la validation (`parseJson`).
 */
export function configFileName(text: string): string {
  const parsed = parseJson(text)
  if (!parsed.ok) return `${FALLBACK_NAME}.json`
  const root = parsed.value
  if (typeof root !== 'object' || root === null || !('exam' in root)) return `${FALLBACK_NAME}.json`
  const exam = root.exam
  if (typeof exam !== 'object' || exam === null || !('title' in exam)) {
    return `${FALLBACK_NAME}.json`
  }
  const title = exam.title
  if (typeof title !== 'string' || title.trim() === '') return `${FALLBACK_NAME}.json`
  return `${slugify(title, FALLBACK_NAME)}.json`
}
