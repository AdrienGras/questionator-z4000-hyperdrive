/** Défauts de PRODUCT.md §6.2, appliqués par la normalisation et lus par les règles croisées. */
export const CONFIG_DEFAULTS = {
  rounding: { mode: 'nearest', decimals: 2, step: null },
  absent: { export: 'label', label: 'ABS' },
  skips: { enabled: true, maxPerStudent: 1, allowFreeText: true },
  presentation: {
    showCumulativeScore: true,
    finalScoreDisplay: 'both',
    showStatsOnFinal: false,
    drawAnimation: true,
    defaultColorMode: 'system',
  },
} as const
