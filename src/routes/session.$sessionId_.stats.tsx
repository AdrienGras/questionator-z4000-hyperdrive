import { createFileRoute } from '@tanstack/react-router'
import { StatsError } from '@/features/stats/stats-error'
import { StatsPage } from '@/features/stats/stats-page'

export const Route = createFileRoute('/session/$sessionId_/stats')({
  component: StatsPage,
  errorComponent: StatsError,
})
