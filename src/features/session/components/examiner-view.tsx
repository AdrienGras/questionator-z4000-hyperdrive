import { Link } from '@tanstack/react-router'
import type { CSSProperties } from 'react'
import { CategoryIcon } from '@/components/category-icon'
import { ColorModeToggle } from '@/components/color-mode-toggle'
import { Button } from '@/components/ui/button'
import type { Session } from '@/domain/session/types'
import { useUi } from '@/lib/i18n/use-ui'

/** Corps provisoire de la vue examinateur : en-tête, catégories, action principale à venir (F09). */
export function ExaminerView({ session }: Readonly<{ session: Session }>) {
  const ui = useUi()
  const { text } = ui
  const { config } = session
  return (
    <main className="mx-auto flex min-h-svh max-w-5xl flex-col gap-6 p-4 sm:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <Link to="/" className="self-start text-sm text-primary underline underline-offset-4">
            {text('back_home', {})}
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">{config.exam.title}</h1>
          <p className="text-muted-foreground">{session.name}</p>
        </div>
        <ColorModeToggle ui={ui} />
      </header>
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">{text('session_categories', {})}</h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {config.categories.map((category) => {
            const { color } = category
            const accent: (CSSProperties & Record<'--category-color', string>) | undefined =
              color === undefined ? undefined : { '--category-color': color }
            return (
              <li
                key={category.id}
                style={accent}
                className="flex items-center gap-3 rounded-lg border p-4 data-[colored=true]:border-[var(--category-color)]"
                data-colored={color !== undefined}
              >
                {category.icon !== undefined && (
                  <CategoryIcon
                    name={category.icon}
                    className="size-6 shrink-0 text-[var(--category-color,currentColor)]"
                  />
                )}
                <span>{category.label}</span>
              </li>
            )
          })}
        </ul>
      </section>
      <div className="flex flex-col items-start gap-2">
        <p className="text-muted-foreground">{text('coming_soon_body', {})}</p>
        <Button disabled>{text('coming_soon_title', {})}</Button>
      </div>
    </main>
  )
}
