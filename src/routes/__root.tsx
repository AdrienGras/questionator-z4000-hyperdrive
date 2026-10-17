import { IconFileX } from '@tabler/icons-react'
import { createRootRoute, Link, Outlet, useMatchRoute } from '@tanstack/react-router'
import { AppearanceProvider } from '@/app/appearance-provider'
import { AppMenu } from '@/components/menu/app-menu'
import { OfflineReadyPrompt } from '@/components/offline-ready-prompt'
import { UpdatePrompt } from '@/components/update-prompt'
import { useUi } from '@/lib/i18n/use-ui'
import { LocaleProvider, useLocale } from '@/lib/i18n/locale-context'
import { StatusScreen } from '@/components/status-screen'
import { buttonVariants } from '@/components/ui/button'

export function NotFound() {
  const { text } = useUi()
  return (
    <StatusScreen icon={<IconFileX />} title={text('not_found_title', {})}>
      <Link to="/" className={buttonVariants({ variant: 'default' })}>
        {text('back_home', {})}
      </Link>
    </StatusScreen>
  )
}

function RootLayout() {
  // Vue projetée : ni menu (D102), ni pastille, puisqu'elle se recharge seule (D72) et que le
  // message hors ligne s'adresse à l'examinateur (F36).
  const projected = useMatchRoute()({ to: '/present/$sessionId' }) !== false
  return (
    <LocaleProvider locale={useLocale()}>
      {/* Thème sombre seul pendant la refonte (D102) ; le mode clair revient en #152. */}
      <AppearanceProvider forcedMode="dark">
        <div className="flex min-h-svh flex-col bg-background text-foreground md:flex-row">
          {/* Le menu est la seule navigation entre espaces ; jamais sur la vue projetée (D102).
              Les `main` des pages prennent `flex-1` dans la colonne de contenu, jamais `min-h-svh` :
              sur téléphone, la barre du haut s'ajouterait à la hauteur de l'écran. */}
          {!projected && <AppMenu />}
          <div className="flex min-w-0 flex-1 flex-col">
            <Outlet />
          </div>
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
