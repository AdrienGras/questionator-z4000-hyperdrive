import type { Milli } from '@/domain/scoring/milli'

/** Moyenne décimale d'une liste de millièmes ; `null` si vide (jamais pour une liste non vide). */
export function mean(values: readonly [Milli, ...Milli[]]): number
export function mean(values: readonly Milli[]): number | null
export function mean(values: readonly Milli[]): number | null {
  if (values.length === 0) return null
  const sum = values.reduce((total, value) => total + value, 0)
  return sum / (values.length * 1000)
}

/** Médiane décimale ; moyenne des deux valeurs centrales si l'effectif est pair ; `null` si vide. */
export function median(values: Milli[]): number | null {
  if (values.length === 0) return null
  const sorted = values.toSorted((a, b) => a - b)
  // Un élément au centre si l'effectif est impair, les deux centraux s'il est pair.
  const centre = sorted.slice(Math.ceil(sorted.length / 2) - 1, Math.floor(sorted.length / 2) + 1)
  return centre.reduce((total, value) => total + value, 0) / centre.length / 1000
}

/**
 * Écart-type de population (÷ n) décimal ; `null` si vide. Variance sur les millièmes entiers :
 * Σ(n·x − Σx)² / n³, une seule opération flottante (la racine) avant le ÷ 1000.
 * Exact tant que Σ(n·x − Σx)² reste sous 2^53 (`Number.MAX_SAFE_INTEGER`). Pire cas : moitié à 0,
 * moitié au maximum M (millièmes), soit n³ · (M/2)² ; pour /20, environ 450 étudiants. Au-delà, le
 * cumul devient flottant et l'erreur d'arrondi reste invisible à 2 décimales.
 */
export function populationStdDev(values: Milli[]): number | null {
  const n = values.length
  if (n === 0) return null
  const sum = values.reduce((total, value) => total + value, 0)
  const squares = values.reduce((total, value) => total + (n * value - sum) ** 2, 0)
  return Math.sqrt(squares / n ** 3) / 1000
}
