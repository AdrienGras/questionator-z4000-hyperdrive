import type { ParsedConfig } from '../config/schema'

/** Plus petite config valide, sans avertissement. Nouvel objet à chaque appel. */
export function minimalConfig(): ParsedConfig {
  return {
    schemaVersion: 1,
    exam: { title: 'Oral de test' },
    scoring: { questionsPerStudent: 1, maxRawScore: 2, finalScale: 20 },
    skips: { enabled: false },
    categories: [
      {
        id: 'a',
        label: 'A',
        scale: [0, 1, 2],
        questions: [{ id: 'a-1', prompt: 'Question A1' }],
      },
    ],
  }
}
