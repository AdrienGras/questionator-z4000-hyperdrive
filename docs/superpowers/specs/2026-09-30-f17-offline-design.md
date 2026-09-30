# F17 — Hors ligne — Design

- **Date** : 2026-09-30
- **Ticket** : [#17](https://github.com/AdrienGras/questionator-z4000-hyperdrive/issues/17)
- **Branche** : `feat/f17-offline`
- **Statut** : spec validée en conversation, figée ici avant le plan d'implémentation.

## Contexte

Le jour de l'oral, le réseau de la salle n'est pas garanti. D36 fixe le cadre : PWA installable, `registerType: 'prompt'`, indicateur dans la vue examinateur seulement, vue projetée rechargée d'elle-même sur `versionchange` de Dexie, critère hors ligne vérifié par Playwright (D33). D45 a déjà posé l'état `outdated` de la base (`useDbStatus()`, `DbStatusBanner`) ; aujourd'hui `PresentPage` affiche ce bandeau au lieu de se recharger. D63 veut toutes les grammaires Shiki pré-cachées : F18 n'est pas livré (six langages), un pré-cache par motif couvrira F18 sans retouche. Les chunks lourds sont déjà isolés et nommés (`_recharts-*`, `_xlsx-*`, D70/D71) ; le chunk d'icônes Tabler pèse ~2,37 Mo minifiés (D37), au-delà de la limite par défaut de Workbox (2 Mio). Le routeur utilise `createHashHistory` : seul `index.html` est une page, aucun `navigateFallback` n'est nécessaire. vite-plugin-pwa 1.3.0 déclare Vite 8 en dépendance pair.

## Objectif

Après un premier chargement en ligne, l'application permet, réseau coupé, de créer une session, de faire passer un étudiant (bloc PHP coloré), d'ouvrir la vue projetée, d'afficher les statistiques et d'exporter un Excel. Une nouvelle version est proposée, jamais appliquée d'office. L'application est installable dans Chrome et Edge.

## Décisions (D72)

- **`clientsClaim: true`** : la page qui installe le service worker passe sous son contrôle sans rechargement ; sinon, un examinateur qui charge l'app puis perd le réseau sans recharger verrait échouer tous les chunks à la demande. Sans risque en mode `prompt` : une mise à jour ne s'active que sur un clic (`skipWaiting` envoyé par `updateSW(true)`).
- **Fenêtres restées sur l'ancien code (amende D36)** : quand une nouvelle version est activée depuis un onglet, l'ancien pré-cache est supprimé et les autres fenêtres ne peuvent plus charger leurs chunks à la demande. Sur `controllerchange` (hors premier chargement), la vue projetée se recharge d'elle-même, comme sur `versionchange` ; les autres onglets examinateur affichent l'indicateur, sans rechargement forcé.
- **Indicateur : pastille fixe en bas à droite**, montée une fois dans le layout racine, absente de `/present/*`, non fermable. Si la base est `outdated`, le bandeau D45 a la priorité et la pastille ne s'affiche pas.
- **Store technique `lib/pwa/pwa-update.ts`** alimenté par `registerSW` (`virtual:pwa-register`, framework-agnostique), sur le modèle de `QuestionatorDb.status` ; hooks par `useSyncExternalStore`. Pas de `useRegisterSW` : il lie l'enregistrement au cycle de vie d'un composant absent de `/present`.
- **Contrôle de couverture du pré-cache** : `pnpm check:precache` échoue en CI si un fichier de `dist/` manque au manifeste de pré-cache de `dist/sw.js` (Workbox écarte un fichier trop gros par un simple avertissement).
- **Icônes** : le soleil rayé de la bannière redessiné en SVG (favicon compris), PNG 192, 512 et 512 `maskable` générés depuis ce SVG et commités.

## Architecture

```
vite.config.ts                    VitePWA(...) ajouté aux plugins
public/icons/icon.svg             soleil rayé (source unique, favicon)
public/icons/icon-192.png         générés depuis icon.svg, commités
public/icons/icon-512.png
public/icons/icon-maskable-512.png
scripts/render-icons.ts           SVG → PNG (lancé à la main, pas en CI)
scripts/check-precache.ts         pnpm check:precache
scripts/check-precache.test.ts
src/lib/pwa/pwa-update.ts         PwaUpdate (état observable, start, applyUpdate), singleton pwaUpdate
src/lib/pwa/hooks.ts              usePwaUpdate(), useReloadOnUpdate(dbOutdated)
src/components/update-prompt.tsx  pastille « Nouvelle version disponible — Recharger »
src/routes/__root.tsx             monte <UpdatePrompt /> hors /present/*
src/features/present/present-page.tsx   useReloadOnUpdate(status === 'outdated')
src/main.tsx                      démarre pwaUpdate en prod (import dynamique de virtual:pwa-register)
index.html                        favicon SVG, theme-color, apple-touch-icon
e2e/offline.spec.ts
e2e/fixtures/offline-php.config.json
```

## Build (vite-plugin-pwa)

- `VitePWA({ registerType: 'prompt', injectRegister: false, manifest, workbox, devOptions: { enabled: false } })`. `base`, `scope` et `start_url` héritent de `base: '/questionator-z4000-hyperdrive/'`.
- `workbox.globPatterns` : `**/*.{js,css,html,json,csv,svg,png,webp,woff2}` — couvre les chunks à la demande (Shiki, Tabler, Recharts, xlsx), les polices Geist, le schéma et les exemples émis par `configSchemaPlugin` (`config.schema.json`, `config.example.json`, `students.example.csv`). Toute extension émise hors de ce motif est signalée par `check:precache`. `dist/.vite/manifest.json` (dossier caché) reste hors pré-cache.
- `workbox.maximumFileSizeToCacheInBytes` : juste au-dessus du plus gros fichier mesuré au build (~3 Mo attendus pour Tabler) ; la mesure est consignée dans la PR et en commentaire.
- `workbox.clientsClaim: true`, `workbox.cleanupOutdatedCaches: true` ; pas de `skipWaiting` (mode `prompt`), pas de cache à l'exécution, pas de `navigateFallback`.
- Aucun WASM (D27).
- Manifeste : `name` « Questionator Z-4000 Hyperdrive », `short_name` « Questionator », `display: standalone`, `theme_color` et `background_color` au violet nuit du fond de l'icône (le thème de l'app est le neutre de shadcn, sans couleur de marque), `lang: 'fr'`, icônes 192, 512 et 512 `purpose: 'maskable'`.

## Store `PwaUpdate`

- État `PwaStatus = 'current' | 'waiting' | 'activated'`, `status`, `onStatusChange(listener) → unsubscribe`. `waiting` : une nouvelle version est installée et attend (rien n'a changé pour cet onglet) ; `activated` : une nouvelle version a pris le contrôle depuis un autre onglet (l'ancien pré-cache est supprimé). Les confondre fait boucler la vue projetée : après rechargement, la version attend toujours et `onNeedRefresh` est réémis.
- `start(register, container = navigator.serviceWorker)` :
  - `hadController = container.controller !== null` au démarrage ;
  - `register({ onNeedRefresh, onNeedReload, onRegisterError })` : `onNeedRefresh` → `waiting` (sauf si déjà `activated`) ; `onNeedReload: () => {}` **obligatoire** : sans lui, `registerSW` en mode `prompt` recharge de lui-même chaque onglet au changement de contrôleur ; `onRegisterError` → `console.warn`, état inchangé ; garde la fonction `updateSW` renvoyée ;
  - `container.addEventListener('controllerchange', …)` : si la page n'avait pas de contrôleur au démarrage, le **premier** `controllerchange` (celui de `clientsClaim`) est ignoré, une seule fois ; ensuite, si cet onglet a appelé `applyUpdate` → `reload()`, sinon → `activated`.
- `applyUpdate()` : en `waiting` avec un `updateSW`, marque l'onglet comme demandeur puis `updateSW(true)` (envoi de `skipWaiting`) ; le rechargement vient du `controllerchange` qui suit. En `activated`, ou sans enregistrement, `location.reload()`.
- Singleton `pwaUpdate` ; `main.tsx` fait, en prod seulement, `void import('virtual:pwa-register').then(({ registerSW }) => pwaUpdate.start(registerSW))`, hors du bundle initial.
- `lib/pwa/` n'importe rien de `domain/` ni de `lib/db/` : `useReloadOnUpdate` reçoit un booléen `dbOutdated`.

## Hooks et UI

- `usePwaUpdate(update = pwaUpdate): { status, applyUpdate }`.
- `useReloadOnUpdate(dbOutdated: boolean, update = pwaUpdate, reload = () => location.reload())` : recharge **une seule fois** (drapeau en `useRef`) dès que `status === 'activated'` ou `dbOutdated` — **jamais** sur `waiting`, qui ne change rien pour la vue projetée ; les deux signaux peuvent arriver ensemble.
- `UpdatePrompt` : visible en `waiting` et en `activated` ; ne rend rien si `status === 'current'` ou si `useDbStatus() === 'outdated'` ; sinon une pastille fixe en bas à droite (`role="status"`), texte « Nouvelle version disponible » et bouton « Recharger » → `applyUpdate()`. Libellés dans le dictionnaire d'UI (`update_available`, `update_reload`, fr/en).
- `__root.tsx` : `<UpdatePrompt />` rendu sauf quand la route active est `/present/$sessionId`.
- `PresentPage` : `useReloadOnUpdate(status === 'outdated')` ; le bandeau `outdated` reste affiché comme repli le temps du rechargement.

## Flux

1. **Premier chargement en ligne** : installation, pré-cache complet, prise de contrôle par `clientsClaim` ; `controllerchange` ignoré ; pas de pastille. Réseau coupé ensuite sans recharger : tout est servi par le cache.
2. **Nouveau déploiement** : détecté au chargement suivant (vérification par défaut de Workbox, sans intervalle ajouté) ; le nouveau service worker attend ; pastille dans chaque onglet examinateur, rien dans la vue projetée ; tant que personne ne clique, tout tourne sur l'ancienne version et l'ancien pré-cache.
3. **Clic sur « Recharger »** : `skipWaiting`, activation, suppression de l'ancien cache, rechargement de l'onglet ; les autres fenêtres reçoivent `controllerchange` : la vue projetée se recharge, les autres onglets examinateur gardent la pastille (« Recharger » → `reload`).
4. **Schéma Dexie monté** : `versionchange` → `outdated` ; la vue projetée se recharge (une seule fois même avec `controllerchange`) ; les onglets examinateur montrent le bandeau D45 à la place de la pastille.
5. **Hors ligne au moment d'un déploiement** : rien à détecter, l'app reste sur la version en cache.

## Erreurs et cas limites

- Service worker indisponible (navigateur, contexte non sécurisé, quota plein pendant le pré-cache) : `console.warn`, état `current`, l'app marche en ligne comme avant F17.
- « Recharger » alors qu'un autre onglet a déjà activé la version : `location.reload()`.
- Vue projetée rechargée sur un schéma incompatible (théorique) : base `unavailable`, bandeau existant, pas de boucle (drapeau à usage unique).
- Images Markdown distantes : non disponibles hors ligne, comme déjà documenté (PRODUCT.md F08).

## Contrôle `check:precache`

- `scripts/check-precache.ts` liste récursivement `dist/`, en excluant `sw.js`, `workbox-*.js` et les dossiers cachés (`.vite/`) ; lit les `url` du manifeste de pré-cache inscrit dans `dist/sw.js` ; échoue en nommant chaque fichier manquant.
- Garde de non-vacuité, comme `check:bundle` : un manifeste vide ou illisible fait échouer le contrôle au lieu de passer.
- CI, job `check` : `pnpm check:precache` après `pnpm check:bundle`.

## Tests

- **Vitest** (colocalisés) :
  - `pwa-update.test.ts` (faux `register`, faux conteneur `EventTarget`) : `onNeedRefresh` → `waiting` ; `onNeedReload` toujours fourni ; premier `controllerchange` sans contrôleur initial ignoré, le suivant pris en compte ; `controllerchange` → `activated` sans `applyUpdate`, → `reload` après `applyUpdate` ; `applyUpdate` appelle `updateSW(true)` en `waiting`, `reload` en `activated` ; `onRegisterError` laisse `current`.
  - `hooks.test.ts` : `useReloadOnUpdate` ne recharge pas en `waiting` ; recharge une fois pour `activated`, une fois pour `outdated`, une seule fois pour les deux (dans les deux ordres).
  - `update-prompt.test.tsx` : rien en `current`, rien en `outdated`, clic → `applyUpdate`, libellés fr et en.
  - `routes.test.tsx` : pastille absente sur `/present/…`, présente sur l'accueil.
  - `check-precache.test.ts` : `dist/` factice complet → succès ; fichier manquant → échec qui le nomme ; manifeste vide → échec.
- **Playwright** `e2e/offline.spec.ts` (sans la fixture `examiner`, qui crée la session en ligne) :
  1. charger l'accueil, attendre `navigator.serviceWorker.ready` et `navigator.serviceWorker.controller` non nul (vérifie `clientsClaim` sans rechargement) ;
  2. `context.setOffline(true)` ;
  3. créer une session avec `students.example.csv` et `e2e/fixtures/offline-php.config.json` (chaque question contient un bloc ```` ```php ````, pour que la vérification ne dépende pas du tirage) ;
  4. faire passer un étudiant jusqu'à l'écran final ; vérifier le bloc PHP coloré (spans portant des variables `--shiki-*`) ;
  5. ouvrir la vue projetée (nouvelle page du contexte hors ligne) et vérifier qu'elle suit ;
  6. ouvrir les statistiques (graphique affiché), exporter l'Excel (téléchargement, signature `PK`).
- **Mise à jour** (Playwright, `e2e/update.spec.ts`, sans second build) : une copie de `dist/` servie par un petit serveur statique propre au test, `sw.js` modifié d'un octet pour simuler un déploiement. Deux onglets examinateur et une vue projetée ouverts avant le déploiement. Attendu : pastille dans les deux onglets examinateur, aucune dans la vue projetée, qui ne se recharge pas tant que personne ne clique ; clic dans l'onglet A → A se recharge une fois, B garde son état (marqueur conservé) et affiche la pastille, la vue projetée se recharge une fois. Même scénario pour un onglet ouvert au tout premier chargement (sans contrôleur initial) : son clic le recharge.
- **Installabilité** (Playwright) : `index.html` lie `manifest.webmanifest`, qui est servi, et ses icônes répondent 200.
- **À la main** (consigné dans la PR) : installation dans Chrome et Edge ; taille totale du pré-cache mesurée ; aperçu des icônes.

## Critères d'acceptation

- Après un chargement en ligne, l'application permet, réseau coupé, de créer une session, de faire passer un étudiant, d'ouvrir la vue projetée et d'exporter un Excel (test Playwright).
- La coloration PHP (F08) fonctionne hors ligne.
- Une nouvelle version déployée est proposée, jamais appliquée d'office ; la vue projetée n'affiche jamais l'indicateur et se recharge d'elle-même.
- L'application est installable (Chrome / Edge).
- `pnpm check:precache` passe en CI.

## Hors périmètre

- Synchronisation entre machines (hors V1).
- Vérification périodique des mises à jour pendant la journée, message « prêt hors ligne », cache à l'exécution des images distantes.
