# Installer le poste

Cette page vous mène du clonage à un `pnpm check` vert. Il vous faut Git, [nvm](https://github.com/nvm-sh/nvm) et un accès à GitHub.

Pour signaler un bug ou proposer une idée sans toucher au code, rien à installer : [`CONTRIBUTING.md`](https://github.com/AdrienGras/questionator-z4000-hyperdrive/blob/main/CONTRIBUTING.md) vous oriente.

## Cloner et installer

```bash
git clone https://github.com/AdrienGras/questionator-z4000-hyperdrive.git
cd questionator-z4000-hyperdrive
nvm use
corepack enable
pnpm install
```

L'adresse SSH `git@github.com:AdrienGras/questionator-z4000-hyperdrive.git` convient aussi.

- `nvm use` lit `.nvmrc` : le projet demande Node 24. Si nvm répond que cette version manque, lancez `nvm install`.
- `corepack enable` active le pnpm épinglé par le champ `packageManager` de `package.json` (pnpm 12.6.0). Un pnpm global plus ancien ne s'en mêle plus. À défaut, préfixez vos commandes par `corepack pnpm`.
- `pnpm install` installe les dépendances. La CI ajoute `--frozen-lockfile`, qui refuse de modifier `pnpm-lock.yaml`.

Pour les tests de bout en bout, installez aussi Chromium. C'est la commande de la CI :

```bash
pnpm exec playwright install --with-deps chromium
```

`--with-deps` installe les bibliothèques système du navigateur, ce qui demande les droits administrateur sous Linux. Vous n'en avez pas besoin pour `pnpm check`.

## Vérifier que tout marche

```bash
pnpm check
```

La commande enchaîne, dans cet ordre, et s'arrête au premier échec :

1. `pnpm format:check` : formatage oxfmt ;
2. `pnpm lint` : oxlint, avec les règles qui demandent les types ;
3. `pnpm deps` : sens des imports entre dossiers (voir [Architecture](./architecture)) ;
4. `pnpm typecheck` : `tsc -b` ;
5. `pnpm test` : tous les tests Vitest.

Elle reproduit les étapes de la CI qui précèdent le build. Elle ne lance ni `pnpm build`, ni `pnpm docs:build`, ni les tests de bout en bout : faites-les tourner avant d'ouvrir une PR si votre changement les concerne.

## Les scripts

| Script | Rôle |
|---|---|
| `pnpm dev` | Serveur de développement Vite, port 5173. Régénère `src/routeTree.gen.ts`. |
| `pnpm check` | Format, lint, dépendances, types et tests. |
| `pnpm format` / `pnpm format:check` | Formate avec oxfmt / vérifie le formatage sans rien écrire. |
| `pnpm lint` | oxlint (`--type-aware --deny-warnings`). |
| `pnpm typecheck` | `tsc -b`. |
| `pnpm test` | Vitest, une passe (`vitest run`). |
| `pnpm e2e` | Tests Playwright. Construit l'app et la doc, puis les sert sur le port 4173. |
| `pnpm build` | `tsc -b` puis build de production dans `dist/`. |
| `pnpm preview` | Sert `dist/` avec `vite preview`, sous `/questionator-z4000-hyperdrive/`. |
| `pnpm deps` | dependency-cruiser sur `src/`. |
| `pnpm docs:dev` | Ce site, en développement. Adresse : `http://localhost:5173/questionator-z4000-hyperdrive/docs/`. |
| `pnpm docs:build` | Construit ce site dans `dist/docs/`. Un lien interne mort fait échouer la commande. |
| `pnpm docs:preview` | Prévisualise le site construit, sur le port 4173. |
| `pnpm docs:screenshots` | Régénère les captures du guide utilisateur (voir [Tests](./tests)). |

D'autres scripts servent surtout à la CI après `pnpm build` : `check:bundle`, `check:precache` et `check:budget` surveillent le bundle initial, le pré-cache du service worker et les budgets de taille. `pnpm icons` régénère les icônes de l'application à la main, hors CI.

## Ports et serveurs

- **5173** : `pnpm dev` et `pnpm docs:dev`. Lancez-en un seul à la fois.
- **4173** : `vite preview` (utilisé par les tests de bout en bout et par les captures) et `pnpm docs:preview` (port par défaut de VitePress). Lancez-en un seul à la fois.

Playwright réutilise un serveur déjà présent sur 4173 quand la variable `CI` est absente (`reuseExistingServer`). Un `vite preview` périmé resté ouvert serait alors testé à la place d'un build frais. Vérifiez avec `ss -ltnp | grep 4173` avant de lancer `pnpm e2e`.

## Construire l'app avant la doc

`pnpm build` vide `dist/`, et `pnpm docs:build` écrit dans `dist/docs/`. Construisez donc l'application d'abord, la doc ensuite. Le serveur de test de Playwright suit cet ordre. Le choix de VitePress est expliqué dans [D96](https://github.com/AdrienGras/questionator-z4000-hyperdrive/blob/main/docs/DECISIONS.md#d96--f27-71--site-de-documentation-vitepress-2026-10-02).

La suite : [Architecture](./architecture).
