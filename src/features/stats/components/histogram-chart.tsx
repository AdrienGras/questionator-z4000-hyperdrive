import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import type { HistogramBin } from '@/domain/stats/types'
import { binLabel, binTick } from '@/features/stats/format-stats'
import type { Ui } from '@/lib/i18n/use-ui'

type HistogramChartProps = Readonly<{ ui: Ui; bins: HistogramBin[] }>

/**
 * Histogramme des notes finales. Purement visuel : `aria-hidden`, le tableau `HistogramTable`
 * porte les mêmes données pour les lecteurs d'écran.
 */
export function HistogramChart({ ui, bins }: HistogramChartProps) {
  const { text, locale } = ui
  const config: ChartConfig = {
    count: { label: text('stats_col_students', {}), color: 'var(--primary)' },
  }
  const data = bins.map((bin, index) => ({
    tick: binTick(bin, locale),
    range: binLabel(bin, index === bins.length - 1, locale),
    count: bin.count,
  }))
  return (
    <div aria-hidden="true">
      <ChartContainer config={config} className="aspect-auto h-56 w-full">
        <BarChart data={data} accessibilityLayer={false}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="tick" tickLine={false} axisLine={false} />
          <YAxis allowDecimals={false} width={28} tickLine={false} axisLine={false} />
          <ChartTooltip
            content={
              <ChartTooltipContent
                labelFormatter={(_, payload) => {
                  const first: { payload?: { range?: string } } | undefined = payload[0]
                  return first?.payload?.range ?? ''
                }}
              />
            }
          />
          <Bar dataKey="count" fill="var(--color-count)" radius={4} />
        </BarChart>
      </ChartContainer>
    </div>
  )
}
