import { useEffect, useState, type ComponentType } from 'react'

type IconComponent = ComponentType<{ className?: string; 'aria-hidden'?: boolean }>

let iconsModule: Promise<Readonly<Record<string, unknown>> | null> | undefined

/** Chunk unique de toutes les icônes Tabler, chargé une fois à la demande (D37). `null` si échec. */
function loadIcons(): Promise<Readonly<Record<string, unknown>> | null> {
  iconsModule ??= import('@tabler/icons-react').then(
    (module) => Object.fromEntries(Object.entries(module)),
    () => null,
  )
  return iconsModule
}

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
