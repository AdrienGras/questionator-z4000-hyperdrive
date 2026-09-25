import type { Locale } from '../i18n'

/** `<exam.title> — <date longue localisée>` (F06, D57). */
export function defaultSessionName(examTitle: string, now: Date, locale: Locale): string {
  return `${examTitle} — ${new Intl.DateTimeFormat(locale, { dateStyle: 'long' }).format(now)}`
}
