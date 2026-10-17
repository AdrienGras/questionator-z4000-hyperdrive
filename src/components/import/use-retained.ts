import { useState } from 'react'

/**
 * Dernière valeur non nulle : un dialogue qui se ferme garde son contenu pendant son animation de
 * fermeture, alors que l'état qui l'alimente est déjà revenu au repos (F34). `value` doit être
 * stable d'un rendu à l'autre (un état, pas un objet recréé à chaque rendu).
 */
export function useRetained<T>(value: T | null): T | null {
  const [kept, setKept] = useState(value)
  if (value !== null && value !== kept) setKept(value)
  return value ?? kept
}
