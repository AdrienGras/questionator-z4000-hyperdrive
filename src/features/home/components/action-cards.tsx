import { IconFileCode, IconFileImport, IconPlus } from '@tabler/icons-react'
import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { Ui } from '@/lib/i18n/use-ui'

type ActionCardsProps = Readonly<{
  ui: Ui
  storageAvailable: boolean
  importDisabled: boolean
  onImport: () => void
}>

const LINK_CLASS = 'text-sm text-primary underline underline-offset-4'

function ActionCard({
  icon,
  title,
  children,
}: Readonly<{ icon: ReactNode; title: string; children: ReactNode }>) {
  return (
    <Card>
      <CardContent className="flex gap-4">
        <span aria-hidden="true" className="shrink-0 text-primary">
          {icon}
        </span>
        <div className="flex min-w-0 flex-col items-start gap-3">
          <h3 className="text-lg font-semibold">{title}</h3>
          {children}
        </div>
      </CardContent>
    </Card>
  )
}

export function ActionCards({ ui, storageAvailable, importDisabled, onImport }: ActionCardsProps) {
  const { text } = ui
  const base = import.meta.env.BASE_URL
  return (
    <section aria-labelledby="home-actions-title" className="flex flex-col gap-4">
      <h2 id="home-actions-title" className="sr-only">
        {text('home_actions_title', {})}
      </h2>
      {storageAvailable && (
        <ActionCard icon={<IconPlus className="size-8" />} title={text('home_create_title', {})}>
          <p className="text-muted-foreground">{text('home_create_body', {})}</p>
          <div className="flex flex-col items-start gap-1">
            <a href={`${base}students.example.csv`} download className={LINK_CLASS}>
              {text('home_students_example_link', {})}
            </a>
            <a href={`${base}config.example.json`} download className={LINK_CLASS}>
              {text('home_config_example_link', {})}
            </a>
            <a
              href={`${base}config.schema.json`}
              target="_blank"
              rel="noreferrer"
              className={LINK_CLASS}
            >
              {text('home_config_schema_link', {})}
            </a>
          </div>
          <Link to="/new" className={buttonVariants()}>
            {text('home_create', {})}
          </Link>
        </ActionCard>
      )}
      <ActionCard
        icon={<IconFileImport className="size-8" />}
        title={text('home_import_title', {})}
      >
        <p className="text-muted-foreground">{text('home_import_body', {})}</p>
        <Button variant="outline" disabled={importDisabled} onClick={onImport}>
          {text('home_import', {})}
        </Button>
      </ActionCard>
      <ActionCard icon={<IconFileCode className="size-8" />} title={text('home_editor_title', {})}>
        <p className="text-muted-foreground">{text('home_editor_body', {})}</p>
        <Link to="/editor" className={buttonVariants()}>
          {text('home_editor_open', {})}
        </Link>
      </ActionCard>
    </section>
  )
}
