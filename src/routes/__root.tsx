import { createRootRoute, Link, Outlet, useMatchRoute } from '@tanstack/react-router'
import { AppearanceProvider } from '@/app/appearance-provider'
import { OfflineReadyPrompt } from '@/components/offline-ready-prompt'
import { UpdatePrompt } from '@/components/update-prompt'
import { useUi } from '@/lib/i18n/use-ui'
import { LocaleProvider, useLocale } from '@/lib/i18n/locale-context'
import { TEXT_LINK_CLASS } from '@/components/text-link'

export function NotFound() {
  const { text } = useUi()
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 p-6">
      <h1 className="text-2xl font-bold">{text('not_found_title', {})}</h1>
      <Link to="/" className={TEXT_LINK_CLASS}>
        {text('back_home', {})}
      </Link>
    </main>
  )
}

function RootLayout() {
  // Jamais de pastille sur la vue projetée : elle se recharge seule (D72), et le message hors ligne
  // s'adresse à l'examinateur (F36).
  const projected = useMatchRoute()({ to: '/present/$sessionId' }) !== false
  return (
    <LocaleProvider locale={useLocale()}>
      <AppearanceProvider>
        <div className="min-h-svh bg-background text-foreground">
          <Outlet />
          {!projected && (
            <>
              <UpdatePrompt />
              <OfflineReadyPrompt />
            </>
          )}
        </div>
      </AppearanceProvider>
    </LocaleProvider>
  )
}

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFound,
})
