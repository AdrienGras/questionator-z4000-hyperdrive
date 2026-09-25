import { renderAt } from './render-at'

/** Monte l'application sur l'accueil (`/`) via le routeur, comme en production. */
export function renderHome() {
  return renderAt('/')
}
