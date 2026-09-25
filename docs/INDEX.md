# Registre des features livrées

Catalogue chronologique de ce qui a été construit. Pour chaque entrée : spec (le
quoi/pourquoi), plan (le comment), statut. Une ligne par feature.

Voir aussi : `ENVIRONMENT.md` · `DECISIONS.md` · `QUIRKS.md` · `BACKLOG.md` · `HANDOFF.md`

---

## Features

| Feature | Date | Spec | Plan | Statut | Notes |
|---|---|---|---|---|---|
| F05 — Accueil et gestion des sessions (#5, PR #27) | 2026-09-25 | `docs/superpowers/specs/2026-09-25-f05-accueil-design.md` | `docs/superpowers/plans/2026-09-25-f05-accueil.md` | Livré | Accueil en cartes (avancement, indicateur `best-effort`, bandeaux `outdated`/`unavailable`, état vide), renommer / examinateur / supprimer avec export d'abord ; `src/backup/` : enveloppe versionnée, `parseBackup` en 5 étapes avec règles croisées (D48), config renormalisée (D49), validateur chargé à la demande ; `SessionSchema` Zod ; dictionnaire d'interface fr/en + langue du navigateur (D51) ; routes provisoires `/new`, `/session/$sessionId` (D50) |
| F04 — Persistance (#4, PR #25) | 2026-09-25 | `docs/superpowers/specs/2026-09-25-f04-persistence-design.md` | `docs/superpowers/plans/2026-09-25-f04-persistence.md` | Livré | `src/db/` : Dexie 4, un document par session, `updateSession` transactionnel (seule voie d'écriture), hooks `useSessions`/`useSession`/`useDbStatus`, états `open`/`outdated`/`unavailable`, stockage persistant ; réactivité entre fenêtres vérifiée (D45–D47) |
| F03 — Moteur de notation (#3, PR #23) | 2026-09-25 | `docs/superpowers/specs/2026-09-25-f03-scoring-design.md` | `docs/superpowers/plans/2026-09-25-f03-scoring.md` | Livré | `src/scoring/` : millièmes entiers, fraction exacte, arrondi entier au pas, `computeScores` (null tant que non terminé), statut, valeur exportée, ajustement, `formatScore` ; types de domaine `src/domain/types.ts` ; F02 borne les valeurs de notation à 10 000 (D42–D44) |
| F02 — Schéma de configuration et validation (#2, PR #21) | 2026-09-25 | `docs/superpowers/specs/2026-09-24-f02-config-design.md` | `docs/superpowers/plans/2026-09-24-f02-config.md` | Livré | `validateConfig` (Zod v4 strict + règles croisées + normalisation), issues typées sans texte, messages fr/en, noyau i18n, JSON Schema + exemple publiés par plugin Vite (D38–D41) |
| F01 — Socle projet et déploiement (#1, PR #18) | 2026-09-24 | `docs/superpowers/specs/2026-09-24-f01-socle-design.md` | `docs/superpowers/plans/2026-09-24-f01-socle.md` | Livré | Vite 8 / React 19 / TS 7, shadcn v4 + Tabler (D37), routeur par hash, oxlint type-aware, CI + Pages, `main` protégée (`check` requis) |

## Commandes / scripts utilitaires

| Commande | Date | Cible |
|---|---|---|
| `.claude/scripts/gh-ticket.sh "<titre>" <corps.md> <P0-P2> <XS-XL> [n° bloquants…]` | 2026-09-24 | Crée une issue `feature`, la range dans le projet n°3 (Status Ready, Priority, Size) et pose les relations « blocked by » |
| `.claude/scripts/sonar-check.sh [--pr <n>|--branch <b>] [--wait]` | 2026-09-24 | Affiche quality gate, issues ouvertes et hotspots SonarQube Cloud ; code 0 si tout est propre |
