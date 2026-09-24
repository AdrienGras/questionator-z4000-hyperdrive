# F01 — Socle projet et déploiement — Design

- **Date** : 2026-09-24
- **Ticket** : [#1](https://github.com/AdrienGras/questionator-z4000-hyperdrive/issues/1)
- **Branche** : `feat/f01-socle`
- **Statut** : spec validée en conversation, figée ici avant le plan d'implémentation.

## Contexte

Premier ticket du projet : poser un dépôt prêt à accueillir F02 à F17, où chaque push sur `main` est vérifié puis déployé sur GitHub Pages.

Références : [`PRODUCT.md`](https://github.com/AdrienGras/questionator-z4000-hyperdrive/blob/main/PRODUCT.md) F01 et §9 · [`docs/DECISIONS.md`](https://github.com/AdrienGras/questionator-z4000-hyperdrive/blob/main/docs/DECISIONS.md) D13 (toolset).

## Objectif

Une application vide, en ligne sur https://adriengras.github.io/questionator-z4000-hyperdrive/, dont le routage survit au rechargement, avec une CI qui bloque sur format, lint, types, tests ou build.

## Design

### Toolset (D13)

| Besoin | Choix |
|---|---|
| Runtime | Node 24 LTS épinglé par `.nvmrc` (nvm en local), pnpm 12 épinglé par `packageManager: "pnpm@<version exacte>"` |
| Build | Vite 8, TypeScript 7 strict (compilateur natif), React 19 |
| UI | Tailwind 4 (`@tailwindcss/vite`), shadcn/ui thème par défaut |
| Routing | TanStack Router, file-based (`@tanstack/router-plugin`), `createHashHistory` |
| Lint | oxlint + oxlint-tsgolint (`--type-aware`), plugins `typescript`, `react`, `jsx-a11y`, `import`, `vitest` |
| Format | Prettier + prettier-plugin-tailwindcss (`tailwindStylesheet: src/index.css`) |
| Tests | Vitest 5, jsdom, Testing Library |

Contraintes :
- **Pas de `baseUrl`** dans les tsconfig (supprimé en TS 7) : seulement `paths` (`@/*` → `src/*`). Le guide shadcn l'ajoute : à retirer après `shadcn init`.
- **Aucune dépendance à l'API JS de TypeScript** (typescript-eslint, ts-morph…).
- pnpm ≥ 11 : scripts d'install autorisés via `allowBuilds` dans `pnpm-workspace.yaml` ; clé inconnue = erreur.

### Structure

```
.nvmrc                  24
package.json
pnpm-workspace.yaml     allowBuilds si nécessaire
vite.config.ts          base: '/questionator-z4000-hyperdrive/', plugins react, tailwind, router
tsconfig.json           → tsconfig.app.json + tsconfig.node.json, paths @/* sans baseUrl
.oxlintrc.json
.prettierrc.json / .prettierignore
components.json         shadcn
index.html
src/
  main.tsx              montage React + RouterProvider
  router.tsx            createRouter + createHashHistory
  routes/__root.tsx     layout racine + notFoundComponent
  routes/index.tsx      accueil placeholder
  routeTree.gen.ts      généré, commité, ignoré par oxlint et Prettier
  index.css             Tailwind v4 + variables CSS shadcn
  lib/utils.ts          cn()
  components/ui/button.tsx
LICENSE                 MIT
README.md
.github/workflows/ci.yml
```

### Scripts

| Script | Commande |
|---|---|
| `dev` / `preview` | `vite` / `vite preview` |
| `build` | `tsc -b && vite build` |
| `typecheck` | `tsc -b` |
| `lint` | `oxlint --type-aware` |
| `format` / `format:check` | `prettier --write .` / `prettier --check .` |
| `test` | `vitest run` |
| `check` | `format:check && lint && typecheck && test` — les mêmes étapes que la CI, hors build |

### Application vide

- Accueil placeholder : titre de l'application + un `Button` shadcn (preuve que Tailwind, shadcn et les alias fonctionnent).
- Route inconnue (`#/nimporte-quoi`) : `notFoundComponent` de l'app. Le routage par hash garantit que GitHub Pages ne renvoie jamais de 404.
- Tests de fumée : l'accueil se rend ; une route inconnue affiche le composant 404. Dans les tests, le routeur est créé avec `createMemoryHistory` (même arbre de routes) ; `createHashHistory` reste réservé à l'app.
- Vitest : environnement `jsdom`, fichier de setup avec `@testing-library/jest-dom`.

### CI/CD — `.github/workflows/ci.yml`

- Déclencheurs : `push` sur `main`, `pull_request`.
- Job `check` : `actions/checkout` → `pnpm/action-setup@v6` (lit `packageManager`) → `actions/setup-node@v7` (`node-version-file: .nvmrc`, cache pnpm) → `pnpm install --frozen-lockfile` → `format:check` → `lint` → `typecheck` → `test` → `build` → `actions/upload-pages-artifact` (`dist`).
- Job `deploy` : `needs: check`, uniquement sur push `main`, `actions/deploy-pages`, permissions `pages: write` + `id-token: write`, `concurrency: pages`.
- Activation de Pages (une fois) : `gh api -X POST repos/AdrienGras/questionator-z4000-hyperdrive/pages -f build_type=workflow`.
- Une fois la CI verte sur `main` : protection de branche sur `main` exigeant le job `check`.

### README

Présentation, usage prévu (créer une session, CSV, config), développement local (`nvm use`, `pnpm install`, `pnpm dev`, `pnpm check`), conventions (gitmoji, une PR par ticket), licence. La section « format des fichiers » (JSON Schema, exemple) est ajoutée par F02.

### Divers

- `.gitignore` : `node_modules`, `dist`, `coverage`, `*.local`.
- `package.json` : `"version": "0.1.0"`, `"private": true`, `"engines": { "node": ">=24" }`.

### Points à vérifier pendant l'implémentation

- `tsc -b` (mode build) avec le compilateur natif TS 7 et les références de projet. S'il pose problème : `tsc -p tsconfig.app.json --noEmit && tsc -p tsconfig.node.json --noEmit`, sans changer le reste.
- Ce que `shadcn init` écrit dans les tsconfig (`baseUrl` à retirer).
- Paquets à scripts d'installation réclamés par pnpm ≥ 11 (à autoriser dans `allowBuilds` au cas par cas).

## Critères d'acceptation

- [ ] L'application vide est accessible sur https://adriengras.github.io/questionator-z4000-hyperdrive/.
- [ ] Recharger la page sur une route (y compris inconnue) réaffiche l'application, jamais une 404 GitHub.
- [ ] La CI échoue si le format, le lint, les types, les tests ou le build échouent (vérifié par une PR volontairement cassée).
- [ ] Un push sur `main` avec CI verte déclenche le déploiement.
- [ ] `nvm use && pnpm install && pnpm check` passe en local sur un clone neuf.
- [ ] Aucun `baseUrl` dans les tsconfig ; aucune dépendance à typescript-eslint.
- [ ] `main` protégée, job `check` requis.

## Hors périmètre

- Thème Synthwave et config d'exemple (F02, F07).
- PWA / service worker (F17).
- Routes métier (accueil réel, création, passage, stats, vue projetée).

## Dépendances

Aucune. Débloque tous les autres tickets.

