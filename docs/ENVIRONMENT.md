# Environnement du projet

Carte des paths, services, accès, commandes. À jour au fil des découvertes.

À consulter **avant de lancer toute commande non-triviale**.

---

## Repo

- **Path hôte** : `/srv/AdrienGras/questionator-z4000-hyperdrive`
- **Remote** : `git@github.com:AdrienGras/questionator-z4000-hyperdrive.git`
- **Branche par défaut** : `main`
- **Convention de merge** : à définir (déploiement GitHub Pages à chaque push sur `main`, cf. `PRODUCT.md` F01)

## Stack d'exécution

- **Runtime** : navigateur uniquement, aucun backend. Stack prévue (`PRODUCT.md` §9), pas encore installée : Vite, React, TypeScript strict, TanStack Router (hash), Tailwind + shadcn/ui, Dexie, Zod v4, PapaParse, ExcelJS, react-markdown + Shiki, vite-plugin-pwa, Vitest.
- **Commandes principales** : aucune pour l'instant (pas de `package.json`).

## Services

| Service | Rôle | Accès |
|---|---|---|
| GitHub Pages | Hébergement de la SPA et du JSON Schema publié | prévu, via GitHub Actions |

## Variables d'environnement

| Bloc | Variables clés |
|---|---|

## Accès / secrets

- Aucun secret applicatif (app front-only, données en IndexedDB local).
