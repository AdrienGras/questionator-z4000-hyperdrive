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
- **Installé (F01)** : Vite 8, React 19, TypeScript 7 (natif), TanStack Router (hash, file-based), Tailwind 4, shadcn v4 (base-ui, preset Nova, icônes Tabler), Vitest 5 + jsdom, oxlint + oxlint-tsgolint, oxfmt (Prettier jusqu’à #88, D94).
- **Ajouté (F02)** : Zod 4.6, jsonc-parser (localisation des erreurs JSON), ajv 8 (dev, test du JSON Schema).
- **Ajouté (F04–F06)** : Dexie 4 + dexie-react-hooks, `fake-indexeddb` (dev), PapaParse 5 (lecture du CSV d'étudiants).
- **Ajouté (F14)** : `@playwright/test` (dev, Chromium seul ; navigateur installé par `pnpm exec playwright install chromium`, dans `~/.cache/ms-playwright`).
- **Prévu** (`PRODUCT.md` §9) : write-excel-file, vite-plugin-pwa.
- **Commandes principales** :
  - `nvm use && corepack pnpm install`
  - `pnpm dev` — serveur de dev (régénère `src/routeTree.gen.ts`)
  - `pnpm check` — format, lint type-aware, dépendances entre dossiers, types, tests (comme la CI, hors build et sans couverture)
  - `pnpm deps` — dependency-cruiser sur `src/` (`.dependency-cruiser.cjs`, parseur swc) ; vérifier que « N modules » n'est pas 0
  - `pnpm build` / `pnpm preview` — build de prod dans `dist/` et prévisualisation sous `/questionator-z4000-hyperdrive/`
  - Après `pnpm build` (comme la CI) : `pnpm check:bundle` (Recharts, xlsx, Shiki, CodeMirror hors du bundle initial), `pnpm check:precache` (tout `dist/` pré-caché), `pnpm check:budget` (budgets gzip, D88 : premier affichage de l'accueil ≤ 275 Ko, chaque chunk ≤ 135 Ko hors `icons-*` et grammaires/thèmes Shiki ; valeurs et mesures en tête de `scripts/check-bundle-budget.ts`)
  - `pnpm docs:dev` / `pnpm docs:build` / `pnpm docs:preview` — site de documentation VitePress (F27, sources dans `site/`) : `docs:dev` sert sur le port 5173 à `http://localhost:5173/questionator-z4000-hyperdrive/docs/` ; `docs:build` écrit dans `dist/docs/` et doit passer **après** `pnpm build` (qui vide `dist/`)
  - `pnpm docs:screenshots` — régénère les 10 captures du guide dans `site/public/screenshots/` (F28) : `playwright test -c playwright.screenshots.config.ts`, le `webServer` construit l'app puis la doc ; Chromium requis ; **non lancé en CI**, les PNG sont commités ; `reuseExistingServer: !CI` : un `vite preview` périmé resté sur 4173 serait photographié au lieu d'un build frais, vérifier `ss -ltnp | grep 4173` avant de lancer
  - `pnpm test` — tests (régénère aussi l'arbre de routes)
  - `pnpm e2e` — Playwright (`e2e/`, pages POM dans `e2e/pages/`) : build puis `vite preview` sur le port 4173 ; job CI `e2e`, dont dépend `deploy`
  - `.claude/scripts/sonar-check.sh --pr <n> --wait` — état SonarQube Cloud d'une PR

## Services

| Service | Rôle | Accès |
|---|---|---|
| GitHub Pages | Hébergement de la SPA (et, dès F02, du JSON Schema) | https://adriengras.github.io/questionator-z4000-hyperdrive/ — déployé par le job `deploy` de `.github/workflows/ci.yml` à chaque push sur `main` |
| JSON Schema et exemple de config | Autocomplétion dans l'éditeur (`$schema`), fichier de départ | https://adriengras.github.io/questionator-z4000-hyperdrive/config.schema.json et `…/config.example.json` ; en dev `http://localhost:5173/questionator-z4000-hyperdrive/config.schema.json` (middleware du plugin `vite/config-schema-plugin.ts`) |
| Service worker (F17) | Pré-cache complet, hors ligne, mise à jour proposée | Build de prod seulement (désactivé sous `pnpm dev`) : tester avec `pnpm build && pnpm preview` (port 4173 ; ajouter `pnpm docs:build` entre les deux pour que `preview` serve aussi la doc) ; `dist/sw.js`, `dist/manifest.webmanifest`. En local, `reuseExistingServer` de Playwright peut réutiliser un `preview` sur un vieux `dist/` |
| Documentation (F27) | Site VitePress, hors pré-cache du SW | https://adriengras.github.io/questionator-z4000-hyperdrive/docs/ — construit par l'étape « Build de la doc » de la CI et déployé avec l'app ; en local, `pnpm preview` la sert à `…/docs/` (avec la barre finale) après les deux builds |
| GitHub Actions | CI : job `check` (requis par la protection de `main`), job `deploy` | `.github/workflows/ci.yml`, actions épinglées par SHA |
| SonarQube Cloud | Analyse de `main` et des PR lancée par la CI (étape « Analyse SonarQube Cloud » du job `check`, F42), couverture comprise (quality gate : nouveau code ≥ 80 %). Analyse automatique **désactivée** (*Administration › Analysis Method*) : les deux modes ne peuvent pas coexister | https://sonarcloud.io/project/overview?id=AdrienGras_questionator-z4000-hyperdrive — config `sonar-project.properties`, contrôle `.claude/scripts/sonar-check.sh` |
| Codecov | Couverture informative : commentaire de PR, statuts `project` et `patch` non bloquants (F42) | https://app.codecov.io/gh/AdrienGras/questionator-z4000-hyperdrive — config `codecov.yml`, envoi par OIDC depuis le job `check` (aucun jeton). Les statuts de commit exigent l'application GitHub Codecov installée sur le compte ; sans elle, seul le commentaire (compte `codecov-commenter`) est publié |
| GitHub Project n°3 | Kanban des tickets (une issue par feature Fxx, label `feature`/`spike`). Champs : Status (Backlog → Ready = spec rédigée dans l’issue → In progress → In review → Done), Priority P0–P2, Size XS–XL | https://github.com/users/AdrienGras/projects/3 — `gh project … --owner AdrienGras` |

## Variables d'environnement

| Bloc | Variables clés |
|---|---|

## Accès / secrets

- Aucun secret applicatif (app front-only, données en IndexedDB local).
- `SONAR_TOKEN` (secret du dépôt GitHub, F42) : jeton d'analyse SonarQube Cloud lu par l'étape « Analyse SonarQube Cloud ». Absent pour une PR venue d'un fork : l'étape est sautée.
- Codecov : pas de `CODECOV_TOKEN`, l'envoi passe par OIDC (`id-token: write` sur le job `check`) ; une PR de fork envoie sans jeton (dépôt public).
