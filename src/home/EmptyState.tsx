import { Link } from '@tanstack/react-router'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { Ui } from '@/i18n/use-ui'

type EmptyStateProps = {
  ui: Ui
  onImport: () => void
}

export function EmptyState({ ui, onImport }: EmptyStateProps) {
  const { text } = ui
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 py-6 text-center">
        <h2 className="text-xl font-semibold">{text('empty_title', {})}</h2>
        <p className="max-w-md text-muted-foreground">{text('empty_body', {})}</p>
        <div className="flex flex-wrap justify-center gap-2">
          <Link to="/new" className={buttonVariants()}>
            {text('home_create', {})}
          </Link>
          <Button variant="outline" onClick={onImport}>
            {text('home_import', {})}
          </Button>
        </div>
        <a
          href={`${import.meta.env.BASE_URL}config.example.json`}
          download
          className="text-sm text-primary underline underline-offset-4"
        >
          {text('empty_example_link', {})}
        </a>
      </CardContent>
    </Card>
  )
}
