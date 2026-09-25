# Registre des features livrées

Catalogue chronologique de ce qui a été construit. Pour chaque entrée : spec (le
quoi/pourquoi), plan (le comment), statut. Une ligne par feature.

Voir aussi : `ENVIRONMENT.md` · `DECISIONS.md` · `QUIRKS.md` · `BACKLOG.md` · `HANDOFF.md`

---

## Features

| Feature | Date | Spec | Plan | Statut | Notes |
|---|---|---|---|---|---|
| F02 — Schéma de configuration et validation (#2, PR #__PR__) | 2026-09-25 | `docs/superpowers/specs/2026-09-24-f02-config-design.md` | `docs/superpowers/plans/2026-09-24-f02-config.md` | Livré | `validateConfig` (Zod v4 strict + règles croisées + normalisation), issues typées sans texte, messages fr/en, noyau i18n, JSON Schema + exemple publiés par plugin Vite (D38–D41) |
| F01 — Socle projet et déploiement (#1, PR #18) | 2026-09-24 | `docs/superpowers/specs/2026-09-24-f01-socle-design.md` | `docs/superpowers/plans/2026-09-24-f01-socle.md` | Livré | Vite 8 / React 19 / TS 7, shadcn v4 + Tabler (D37), routeur par hash, oxlint type-aware, CI + Pages, `main` protégée (`check` requis) |

## Commandes / scripts utilitaires

| Commande | Date | Cible |
|---|---|---|
| `.claude/scripts/gh-ticket.sh "<titre>" <corps.md> <P0-P2> <XS-XL> [n° bloquants…]` | 2026-09-24 | Crée une issue `feature`, la range dans le projet n°3 (Status Ready, Priority, Size) et pose les relations « blocked by » |
| `.claude/scripts/sonar-check.sh [--pr <n>|--branch <b>] [--wait]` | 2026-09-24 | Affiche quality gate, issues ouvertes et hotspots SonarQube Cloud ; code 0 si tout est propre |
