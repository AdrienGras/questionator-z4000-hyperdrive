import { Button } from '@/components/ui/button'

export function App() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 text-foreground">
      <h1 className="text-3xl font-bold tracking-tight">Questionator Z-4000 Hyperdrive</h1>
      <Button>Commencer</Button>
    </main>
  )
}
