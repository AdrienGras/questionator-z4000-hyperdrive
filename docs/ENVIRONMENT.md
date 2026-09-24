# Environnement du projet

Carte des paths, services, accès, commandes. À jour au fil des découvertes.

À consulter **avant de lancer toute commande non-triviale**.

---

## Repo

- **Path hôte** : `/srv/AdrienGras/questionator-z4000-hyperdrive`
- **Remote** : `git@github.com:AdrienGras/questionator-z4000-hyperdrive.git`
- **Branche par défaut** : `main`
- **Convention de merge** : une branche par ticket (`feat/f01-socle`, `fix/…`), PR vers `main` avec `Closes #n`, CI verte requise. Déploiement GitHub Pages à chaque push sur `main`.

## Stack d'exécution

- **Runtime** : navigateur uniquement, aucun backend. Node 24 (`.nvmrc`, via nvm) pour l'outillage ; pnpm 12.6.0 épinglé par `packageManager` (lancer `corepack pnpm …` si le pnpm global est plus ancien).
- **Installé (F01)** : Vite 8, React 19, TypeScript 7 (natif), TanStack Router (hash, file-based), Tailwind 4, shadcn v4 (base-ui, preset Nova, icônes Tabler), Vitest 5 + jsdom, oxlint + oxlint-tsgolint, Prettier.
- **Prévu** (`PRODUCT.md` §9) : Dexie, Zod v4, PapaParse, write-excel-file, react-markdown + Shiki, vite-plugin-pwa, Playwright.
- **Commandes principales** :
  - `nvm use && corepack pnpm install`
  - `pnpm dev` — serveur de dev (régénère `src/routeTree.gen.ts`)
  - `pnpm check` — format, lint type-aware, types, tests (comme la CI, hors build)
  - `pnpm build` / `pnpm preview` — build de prod dans `dist/` et prévisualisation sous `/questionator-z4000-hyperdrive/`
  - `pnpm test` — tests (régénère aussi l'arbre de routes)
  - `.claude/scripts/sonar-check.sh --pr <n> --wait` — état SonarQube Cloud d'une PR

## Services

| Service | Rôle | Accès |
|---|---|---|
| GitHub Pages | Hébergement de la SPA (et, dès F02, du JSON Schema) | https://adriengras.github.io/questionator-z4000-hyperdrive/ — déployé par le job `deploy` de `.github/workflows/ci.yml` à chaque push sur `main` |
| GitHub Actions | CI : job `check` (requis par la protection de `main`), job `deploy` | `.github/workflows/ci.yml`, actions épinglées par SHA |
| SonarQube Cloud | Analyse automatique de `main` et des PR (quality gate) | https://sonarcloud.io/project/overview?id=AdrienGras_questionator-z4000-hyperdrive — `.claude/scripts/sonar-check.sh` |
| GitHub Project n°3 | Kanban des tickets (une issue par feature Fxx, label `feature`/`spike`). Champs : Status (Backlog → Ready = spec rédigée dans l’issue → In progress → In review → Done), Priority P0–P2, Size XS–XL | https://github.com/users/AdrienGras/projects/3 — `gh project … --owner AdrienGras` |

## Variables d'environnement

| Bloc | Variables clés |
|---|---|

## Accès / secrets

- Aucun secret applicatif (app front-only, données en IndexedDB local).
