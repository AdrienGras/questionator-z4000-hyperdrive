import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
import { AppearanceProvider } from '@/app/appearance-provider'
import { useUi } from '@/lib/i18n/use-ui'
import { LocaleProvider, useLocale } from '@/lib/i18n/locale-context'

export function NotFound() {
  const { text } = useUi()
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 p-6">
      <h1 className="text-2xl font-bold">{text('not_found_title', {})}</h1>
      <Link to="/" className="text-primary underline underline-offset-4">
        {text('back_home', {})}
      </Link>
    </main>
  )
}

function RootLayout() {
  return (
    <LocaleProvider locale={useLocale()}>
      <AppearanceProvider>
        <div className="min-h-svh bg-background text-foreground">
          <Outlet />
        </div>
      </AppearanceProvider>
    </LocaleProvider>
  )
}

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFound,
})
