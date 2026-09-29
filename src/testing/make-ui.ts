import { t, type Locale } from '@/lib/i18n/i18n'
import { UI_MESSAGES } from '@/lib/i18n/ui-messages'
import type { Ui } from '@/lib/i18n/use-ui'

/** `Ui` de test, construit comme `useUi` sans passer par le contexte de langue. */
export function makeUi(locale: Locale = 'fr'): Ui {
  return { locale, text: (key, params) => t(UI_MESSAGES, locale, key, params) }
}
