import type { Session } from '@/domain/session/types'
import type { Ui } from '@/lib/i18n/use-ui'

type ProjectionBannerProps = Readonly<{
  ui: Ui
  session: Session
  activeStudentId: string | undefined
}>

/**
 * Rappelle à l'examinateur que la vue projetée montre un autre étudiant que celui qu'il
 * fait passer (F14). Rien ne s'affiche en attente, ni si l'étudiant projeté est l'actif,
 * ni si l'étudiant projeté n'existe plus.
 */
export function ProjectionBanner({ ui, session, activeStudentId }: ProjectionBannerProps) {
  const { projection } = session
  if (projection.mode !== 'student' || projection.studentId === activeStudentId) return null
  const projected = session.students.find((s) => s.id === projection.studentId)
  if (projected === undefined) return null
  return (
    <output className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
      {ui.text('projection_banner', { name: `${projected.lastName} ${projected.firstName}` })}
    </output>
  )
}
