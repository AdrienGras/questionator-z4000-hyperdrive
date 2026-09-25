import { Link } from '@tanstack/react-router'
import { useUi } from '@/i18n/use-ui'

/** Écran provisoire des routes pas encore livrées (D50) ; F06 et F09 le remplacent. */
export function ComingSoon() {
  const { text } = useUi()
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-bold">{text('coming_soon_title', {})}</h1>
      <p className="text-muted-foreground">{text('coming_soon_body', {})}</p>
      <Link to="/" className="text-primary underline underline-offset-4">
        {text('back_home', {})}
      </Link>
    </main>
  )
}
