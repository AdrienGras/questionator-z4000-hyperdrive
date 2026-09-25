import { useEffect, useState, type ComponentType } from 'react'

type IconComponent = ComponentType<{ className?: string; 'aria-hidden'?: boolean }>

/**
 * Fabrique du chargeur du chunk d'icônes Tabler : le cache (`iconsModule`) vit dans la fermeture
 * plutôt qu'au niveau du module, pour rester testable avec un `importIcons` injecté (`vi.fn`),
 * sans `vi.mock` ni réinstanciation du module (D37).
 *
 * Un échec (réseau, chunk introuvable) est transitoire : le cache est vidé pour qu'un appel
 * ultérieur (donc un montage ultérieur de `CategoryIcon`) retente le chargement, au lieu de
 * renvoyer indéfiniment `null` pour la session. `null` est renvoyé pour l'appel en échec.
 */
export function createIconLoader(
  importIcons: () => Promise<object>,
): () => Promise<Readonly<Record<string, unknown>> | null> {
  let iconsModule: Promise<Readonly<Record<string, unknown>> | null> | undefined
  return function loadIcons(): Promise<Readonly<Record<string, unknown>> | null> {
    iconsModule ??= importIcons().then(
      (module) => Object.fromEntries(Object.entries(module)),
      () => {
        iconsModule = undefined
        return null
      },
    )
    return iconsModule
  }
}

// Import profond (le paquet n'a pas de champ `exports`, donc autorisé) plutôt que le barrel
// `@tabler/icons-react` : sinon Rollup regroupe ce chunk dynamique avec les imports statiques par
// nom (`IconSun`, `IconDots`…) qui visent le même module, et le fait fuiter dans le bundle initial
// (D37).
const loadIcons = createIconLoader(() => import('@tabler/icons-react/dist/esm/icons/index.mjs'))

function isIconComponent(value: unknown): value is IconComponent {
  // Composants Tabler : `forwardRef` (objet) ; une fonction reste acceptée.
  return typeof value === 'function' || (typeof value === 'object' && value !== null)
}

/** Nom kebab-case de la config → export Tabler (`brand-php` → `IconBrandPhp`). */
export function iconComponentName(name: string): string {
  const pascal = name
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
  return `Icon${pascal}`
}

/** Icône d'une catégorie ; rien pendant le chargement, si le nom est inconnu ou si le chunk échoue. */
export function CategoryIcon({ name, className }: Readonly<{ name: string; className?: string }>) {
  const [Icon, setIcon] = useState<IconComponent | null>(null)
  useEffect(() => {
    let active = true
    void loadIcons().then((icons) => {
      const candidate = icons?.[iconComponentName(name)]
      if (active) setIcon(() => (isIconComponent(candidate) ? candidate : null))
    })
    return () => {
      active = false
    }
  }, [name])
  return Icon === null ? null : <Icon className={className} aria-hidden />
}
