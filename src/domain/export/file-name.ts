import { localDateStamp, slugify } from '@/domain/session/file-name'
import type { Session } from '@/domain/session/types'

/** `<slug>-<AAAA-MM-JJ>.xlsx`, date locale ; slug de repli `session`. */
export function workbookFileName(session: Session, now: Date): string {
  return `${slugify(session.name)}-${localDateStamp(now)}.xlsx`
}
