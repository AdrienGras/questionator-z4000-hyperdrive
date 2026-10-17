import { createFileRoute } from '@tanstack/react-router'
import { HomePage } from '@/features/home/home-page'

// Provisoire (#146) : l'accueil, en attendant la page de l'espace (#147).
export const Route = createFileRoute('/sessions')({
  component: HomePage,
})
