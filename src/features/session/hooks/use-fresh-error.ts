import { useState } from 'react'

/**
 * Échec d'une action de passage, tel que montré à l'utilisateur. Un objet par occurrence :
 * deux échecs successifs au même message restent distinguables par identité.
 */
export type Failure = Readonly<{ message: string }>

/**
 * Ne laisse passer que les erreurs survenues pendant que le conteneur (tiroir, dialogue) est
 * ouvert. L'erreur présente à l'ouverture est mémorisée et masquée tant qu'elle n'est pas remplacée ;
 * fermé, rien n'est renvoyé. La comparaison se fait par identité de l'occurrence, pas par message.
 */
export function useFreshError(error: Failure | undefined, open: boolean): Failure | undefined {
  const [wasOpen, setWasOpen] = useState(open)
  const [stale, setStale] = useState<Failure | undefined>(open ? error : undefined)
  if (open !== wasOpen) {
    setWasOpen(open)
    setStale(open ? error : undefined)
  }
  return open && error !== stale ? error : undefined
}
