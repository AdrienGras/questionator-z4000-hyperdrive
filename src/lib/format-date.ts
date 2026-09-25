import type { Locale } from '@/lib/i18n/i18n'

export function formatDateTime(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(iso),
  )
}
