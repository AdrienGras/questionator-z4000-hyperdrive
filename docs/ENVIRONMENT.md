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

- **Runtime** : navigateur uniquement, aucun backend. Stack prévue (`PRODUCT.md` §9), pas encore installée : Vite, React, TypeScript strict, TanStack Router (hash), Tailwind + shadcn/ui, Dexie, Zod v4, PapaParse, ExcelJS, react-markdown + Shiki, vite-plugin-pwa, Vitest.
- **Commandes principales** : aucune pour l'instant (pas de `package.json`).

## Services

| Service | Rôle | Accès |
|---|---|---|
| GitHub Pages | Hébergement de la SPA et du JSON Schema publié | prévu, via GitHub Actions |
| GitHub Project n°3 | Kanban des tickets (une issue par feature Fxx, label `feature`/`spike`). Champs : Status (Backlog → Ready = spec rédigée dans l’issue → In progress → In review → Done), Priority P0–P2, Size XS–XL | https://github.com/users/AdrienGras/projects/3 — `gh project … --owner AdrienGras` |

## Variables d'environnement

| Bloc | Variables clés |
|---|---|

## Accès / secrets

- Aucun secret applicatif (app front-only, données en IndexedDB local).
