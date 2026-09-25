import { IconAlertTriangle } from '@tabler/icons-react'
import type { Ui } from '@/lib/i18n/use-ui'
import { formatCsvIssue } from '@/domain/students/messages'
import { type CsvIssue } from '@/domain/students/issues'
import { type CsvParseResult } from '@/domain/students/parse-csv'
import { errorsFirst, keyed } from '@/lib/issue-list'

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
  const issues = keyed(errorsFirst(result.issues), (issue) => `${issue.code}|${issue.line ?? ''}`)
  return (
    <div className="flex flex-col gap-2">
      <h3 className="font-semibold">
        {text('preview_students_count', { count: result.students.length })}
      </h3>
      {result.students.length > 0 && (
        <details>
          <summary className="cursor-pointer text-sm text-primary">
            {text('preview_students_list', {})}
          </summary>
          <ol className="mt-2 list-decimal pl-6 text-sm">
            {result.students.map((student) => (
              <li key={student.line}>
                {student.lastName} {student.firstName}
              </li>
            ))}
          </ol>
        </details>
      )}
      {issues.length > 0 && (
        <ul className="flex flex-col gap-1 text-sm">
          {issues.map(({ item: issue, key }) =>
            issue.severity === 'error' ? (
              <li key={key} className="text-destructive">
                {issueText(ui, issue)}
              </li>
            ) : (
              <li key={key} className="flex items-start gap-2 text-muted-foreground">
                <IconAlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0" />
                {issueText(ui, issue)}
              </li>
            ),
          )}
        </ul>
      )}
    </div>
  )
}
