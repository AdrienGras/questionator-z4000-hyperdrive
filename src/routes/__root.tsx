import { createRootRoute, Link, Outlet } from '@tanstack/react-router'

export function NotFound() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 p-6">
      <h1 className="text-2xl font-bold">Page introuvable</h1>
      <Link to="/" className="text-primary underline underline-offset-4">
        Retour à l'accueil
      </Link>
    </main>
  )
}

export const Route = createRootRoute({
  component: () => (
    <div className="min-h-svh bg-background text-foreground">
      <Outlet />
    </div>
  ),
  notFoundComponent: NotFound,
})
