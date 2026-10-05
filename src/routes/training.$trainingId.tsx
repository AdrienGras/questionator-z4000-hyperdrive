import { createFileRoute } from '@tanstack/react-router'

// Route réservée : l'écran d'entraînement arrive avec la tâche suivante de F43.3.
export const Route = createFileRoute('/training/$trainingId')({})
