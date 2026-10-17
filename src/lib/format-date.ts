import type { Locale } from '@/lib/i18n/i18n'

export function formatDateTime(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(iso),
  )
}

/** Date courte sans année (« 14 oct., 10:42 »), pour les cartes de l'accueil. */
export function formatShortDateTime(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso))
}
