/**
 * Vérifie que l'animation SVG en tête du README (`assets/readme-hero.svg`, #74) respecte les limites
 * de rendu de GitHub et les garde-fous du projet : poids borné, aucun script ni ressource externe
 * (GitHub les neutralise ou les bloque, et le SVG doit rester autonome), respect de
 * `prefers-reduced-motion`, pas de `animation-delay` (décalages portés autrement), texte lisible
 * une fois l'image réduite à la largeur du README.
 * Lancé par `pnpm check:hero` (et donc par `pnpm check`).
 * Exécuté par Node natif (types retirés) : imports avec extension `.ts`, syntaxe effaçable.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

/** Poids maximal du SVG, en octets UTF-8. */
const MAX_BYTES = 102_400

/** Taille de police minimale (unités du viewBox) pour rester lisible sous la largeur du README. */
const MIN_FONT_SIZE = 40

const REDUCED_MOTION = /@media\s*\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)/
/** Tout `href` (y compris `xlink:href`) dont la valeur ne commence pas par `#`. */
const EXTERNAL_HREF = /href\s*=\s*(?:"(?!\s*#)[^"]*"|'(?!\s*#)[^']*')/i
/** Tout `url(` dont l'argument ne commence pas par `#` (guillemets et espaces tolérés). */
const EXTERNAL_URL = /url\((?!\s*#|\s*["']\s*#)/i
const CSS_IMPORT = /@import/i
const FONT_SIZE = /font-size\s*(?:=\s*["']|:)\s*(\d+(?:\.\d+)?)/g
/**
 * Corps des commentaires XML. Un `--` y est interdit (XML 1.0 §2.5) : le fichier ne s'affiche plus
 * en `<img>` ni ouvert seul, alors qu'un SVG inséré dans du HTML le tolère.
 */
const XML_COMMENT = /<!--([\s\S]*?)-->/g

/** Problèmes (messages en français) d'un SVG d'animation ; vide s'il est conforme. */
export function findHeroIssues(svg: string): string[] {
  const issues: string[] = []
  const bytes = Buffer.byteLength(svg, 'utf8')
  if (bytes > MAX_BYTES)
    issues.push(`Poids de ${bytes} octets, au-delà de la limite de ${MAX_BYTES} octets.`)
  if (/<script[\s>/]/i.test(svg)) issues.push('Élément <script> interdit.')
  if (/\son[a-z]+\s*=/i.test(svg))
    issues.push('Attribut de gestionnaire d’événement (onload…) interdit.')
  if (/<foreignObject[\s>/]/i.test(svg)) issues.push('Élément <foreignObject> interdit.')
  if (EXTERNAL_HREF.test(svg))
    issues.push('Attribut href autre qu’une référence interne (#id) interdit.')
  if (EXTERNAL_URL.test(svg)) issues.push('url() autre qu’une référence interne (#id) interdit.')
  if (CSS_IMPORT.test(svg)) issues.push('Règle @import interdite.')
  if (!REDUCED_MOTION.test(svg)) {
    issues.push('Bloc @media (prefers-reduced-motion: reduce) manquant.')
  }
  if (/animation-delay/i.test(svg)) issues.push('Propriété animation-delay interdite.')
  for (const match of svg.matchAll(FONT_SIZE)) {
    if (Number(match[1]) < MIN_FONT_SIZE) {
      issues.push(`font-size ${match[1]} inférieur au minimum de ${MIN_FONT_SIZE}.`)
    }
  }
  for (const [, body] of svg.matchAll(XML_COMMENT)) {
    if (body.includes('--') || body.endsWith('-')) {
      issues.push(
        `Double tiret dans un commentaire, XML invalide : « ${body.trim().slice(0, 40)} ».`,
      )
    }
  }
  return issues
}

/** Code de sortie : 0 si tous les fichiers sont conformes, 1 sinon (`report` reçoit une ligne par problème). */
export function main(
  files: readonly string[],
  report: (line: string) => void = (line) => console.error(line),
): number {
  let failed = false
  for (const file of files) {
    for (const issue of findHeroIssues(readFileSync(file, 'utf8'))) {
      report(`${file} : ${issue}`)
      failed = true
    }
  }
  if (!failed) console.log(`Animation du README conforme : ${files.join(', ')}.`)
  return failed ? 1 : 0
}

if (process.argv[1] === fileURLToPath(import.meta.url))
  process.exit(main(['assets/readme-hero.svg']))
