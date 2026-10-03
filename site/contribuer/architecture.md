# Architecture

L'application tourne entièrement dans le navigateur, sans serveur. Cette page situe le code. Le détail des règles de rangement est dans la mémoire projet, que ce guide ne recopie pas.

## Carte de `src/`

| Dossier | Contenu |
|---|---|
| `app/` | Création du routeur (`router.tsx`) et fournisseurs globaux (apparence). |
| `routes/` | Routes TanStack Router, minces : chacune importe la page d'une feature. |
| `features/<x>/` | Un écran : `config-editor`, `create-session`, `home`, `present`, `session`, `stats`. Chaque dossier a sa page, ses `components/` et ses `hooks/`. |
| `components/` | Composants partagés (`export/`, `markdown/`, `projection/`, `ui/`). `ui/` contient les composants shadcn, vendus et non modifiés. |
| `hooks/` | Hooks transverses. |
| `lib/` | Technique, sans règle métier : `db/`, `i18n/`, `pwa/`, `xlsx/`, `markdown/`, `appearance/`, et des utilitaires. |
| `domain/<concept>/` | Règles du produit, sans React ni Dexie : `backup`, `config`, `export`, `passage`, `presentation`, `scoring`, `session`, `stats`, `students`. |
| `testing/` | Fixtures et réglages Vitest, importés par les tests seulement. |

Les tests vivent à côté du code qu'ils couvrent : `x.test.ts` à côté de `x.ts`.

## Où ranger un nouveau fichier

Lisez [Arborescence et imports](https://github.com/AdrienGras/questionator-z4000-hyperdrive/blob/main/docs/CONVENTIONS.md#arborescence-et-imports--squelette) avant de créer un fichier, puis [Où ranger un nouveau fichier](https://github.com/AdrienGras/questionator-z4000-hyperdrive/blob/main/docs/CONVENTIONS.md#où-ranger-un-nouveau-fichier). L'arbitrage est tracé dans [D59](https://github.com/AdrienGras/questionator-z4000-hyperdrive/blob/main/docs/DECISIONS.md#d59--arborescence-de-src--lib-domain-features-sens-des-imports-vérifié-par-dependency-cruiser-2026-09-25).

## Sens des imports

Un dossier n'importe que ceux qui sont plus bas que lui :

```
lib  ←  domain  ←  components  ←  features  ←  routes / app
```

Une feature n'importe jamais une autre feature. Quand deux écrans partagent du code, il remonte dans `components/`, `lib/` ou `domain/`.

`pnpm deps` fait respecter ce sens avec dependency-cruiser. Les règles sont dans [`.dependency-cruiser.cjs`](https://github.com/AdrienGras/questionator-z4000-hyperdrive/blob/main/.dependency-cruiser.cjs), chacune avec son commentaire. La CI et `pnpm check` lancent la commande. Si elle échoue, déplacez le fichier au bon endroit : on ne modifie pas la règle pour la contourner.

## Routes

Les routes sont des fichiers de `src/routes/` (`session.$sessionId.tsx`, `present.$sessionId.tsx`…). Le routeur utilise l'historique par hash : les adresses ont la forme `…/#/session/<id>`, ce qui convient à GitHub Pages. `src/routeTree.gen.ts` est généré par le plugin TanStack et commité ; `pnpm dev` et `pnpm test` le régénèrent. La CI échoue s'il n'est pas à jour. Le gabarit d'une route : [Route TanStack](https://github.com/AdrienGras/questionator-z4000-hyperdrive/blob/main/docs/CONVENTIONS.md#route-tanstack-file-based--squelette).

## Stockage local

Les sessions sont enregistrées dans IndexedDB par [Dexie](https://dexie.org), dans `src/lib/db/`. Seul ce dossier importe le singleton `db`, et toute écriture métier passe par `updateSession`. Cette règle est vérifiée par `pnpm deps`. Le gabarit : [Mutation de session](https://github.com/AdrienGras/questionator-z4000-hyperdrive/blob/main/docs/CONVENTIONS.md#mutation-de-session--squelette).

## Service worker

L'app fonctionne hors ligne grâce à `vite-plugin-pwa`, configuré dans [`vite.config.ts`](https://github.com/AdrienGras/questionator-z4000-hyperdrive/blob/main/vite.config.ts) en mode `prompt` : un nouveau service worker attend que l'utilisateur accepte la mise à jour. La logique côté page est dans `src/lib/pwa/`. L'enregistrement se fait à la main dans `src/main.tsx`, en production seulement. Cette documentation n'est pas pré-cachée et passe toujours par le réseau.

## Le reste du dépôt

| Dossier | Contenu |
|---|---|
| `site/` | Ce site VitePress, guide utilisateur et guide contributeur. |
| `e2e/` | Tests Playwright, avec leurs page objects dans `e2e/pages/` et les captures du guide dans `e2e/screenshots/`. |
| `scripts/` | Scripts Node de contrôle du build (`check-*.ts`), génération des icônes. |
| `vite/` | Plugins et constantes de la configuration Vite. |
| `examples/` | Fichiers d'exemple (étudiants, config). |
| `docs/` | Mémoire projet (voir [Travailler avec Claude Code](./claude-code)). |
| `.claude/` | Réglages, hooks et scripts de Claude Code. |

La suite : [Conventions](./conventions).
