import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

/**
 * Tailles de texte du design system (`--text-*` de `index.css`). Sans elles, tailwind-merge prend
 * `text-score-md` pour une couleur et le retire devant `text-destructive`.
 */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: ['display', 'h1', 'h2', 'h3', 'score-xl', 'score-md', 'body', 'small', 'label'],
    },
  },
})

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
