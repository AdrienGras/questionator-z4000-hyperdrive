import type { NormalizedCategory, NormalizedConfig } from '@/domain/config/normalize'

/** Catégorie de la config, ou `undefined` si l'id n'y figure plus (backup incohérent). */
export function findCategory(
  config: NormalizedConfig,
  categoryId: string,
): NormalizedCategory | undefined {
  return config.categories.find((category) => category.id === categoryId)
}

/** Libellé de la catégorie ; son id si elle n'existe plus. */
export function categoryLabel(config: NormalizedConfig, categoryId: string): string {
  return findCategory(config, categoryId)?.label ?? categoryId
}

/** Titre de la question ; son id si elle n'existe plus dans la config (Review Focus 5). */
export function questionTitle(
  config: NormalizedConfig,
  categoryId: string,
  questionId: string,
): string {
  const question = findCategory(config, categoryId)?.questions.find((q) => q.id === questionId)
  return question?.title ?? questionId
}
