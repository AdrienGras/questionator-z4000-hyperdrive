import { IconAlertTriangle, IconCircleX } from '@tabler/icons-react'
import type { Ui } from '@/lib/i18n/use-ui'
import { formatCsvIssue } from '@/domain/students/messages'
import { type CsvIssue } from '@/domain/students/issues'
import { type CsvParseResult } from '@/domain/students/parse-csv'
import { errorsFirst, keyed } from '@/lib/issue-list'
import { PreviewCard, PreviewFigure } from '@/features/create-session/components/preview-card'

type StudentsPreviewProps = Readonly<{
  ui: Ui
  result: CsvParseResult
}>

function issueText(ui: Ui, issue: CsvIssue): string {
  const message = formatCsvIssue(issue, ui.locale)
  return issue.line === undefined ? message : ui.text('preview_line', { line: issue.line, message })
}

/** Aperçu de la liste d'étudiants lue : nombre, liste repliable, puis issues (erreurs d'abord). */
export function StudentsPreview({ ui, result }: StudentsPreviewProps) {
  const { text } = ui
  const count = result.students.length
  const issues = keyed(errorsFirst(result.issues), (issue) => `${issue.code}|${issue.line ?? ''}`)
  return (
    <PreviewCard label={text('preview_students_title', {})}>
      <PreviewFigure value={count} noun={text('preview_students_noun', { count })} />
      {count > 0 && (
        <details className="text-sm">
          <summary className="cursor-pointer font-semibold">
            {text('preview_students_list', {})}
          </summary>
          <ol className="mt-2 list-decimal pl-6">
            {result.students.map((student) => (
              <li key={student.line}>
                {student.lastName} {student.firstName}
              </li>
            ))}
          </ol>
        </details>
      )}
      {issues.length > 0 && (
        <ul className="flex flex-col gap-2 text-small">
          {issues.map(({ item: issue, key }) => {
            const isError = issue.severity === 'error'
            const IssueIcon = isError ? IconCircleX : IconAlertTriangle
            return (
              <li
                key={key}
                className={`flex items-start gap-2 ${isError ? 'text-destructive' : 'text-muted-foreground'}`}
              >
                <IssueIcon aria-hidden className="mt-px size-4 shrink-0" />
                {issueText(ui, issue)}
              </li>
            )
          })}
        </ul>
      )}
    </PreviewCard>
  )
}
