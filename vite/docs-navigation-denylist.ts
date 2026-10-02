/**
 * Navigations que le service worker ne doit pas détourner vers l'app : le site de documentation (F27, D96)
 * vit sous `<base>docs/`, dans le même scope. Workbox teste ce motif contre `pathname + search`.
 * Couvre `…/docs/…`, `…/docs` sans barre finale et `…/docs?…`, sans attraper `…/docsfoo` ni `?docs=1`.
 */
export const DOCS_NAVIGATION_DENYLIST = /\/docs(?:[/?]|$)/
