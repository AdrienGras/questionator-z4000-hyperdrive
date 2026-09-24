# Registre des features livrées

Catalogue chronologique de ce qui a été construit. Pour chaque entrée : spec (le
quoi/pourquoi), plan (le comment), statut. Une ligne par feature.

Voir aussi : `ENVIRONMENT.md` · `DECISIONS.md` · `QUIRKS.md` · `BACKLOG.md` · `HANDOFF.md`

---

## Features

| Feature | Date | Spec | Plan | Statut | Notes |
|---|---|---|---|---|---|

## Commandes / scripts utilitaires

| Commande | Date | Cible |
|---|---|---|
| `.claude/scripts/gh-ticket.sh "<titre>" <corps.md> <P0-P2> <XS-XL> [n° bloquants…]` | 2026-09-24 | Crée une issue `feature`, la range dans le projet n°3 (Status Ready, Priority, Size) et pose les relations « blocked by » |
| `.claude/scripts/sonar-check.sh [--pr <n>|--branch <b>] [--wait]` | 2026-09-24 | Affiche quality gate, issues ouvertes et hotspots SonarQube Cloud ; code 0 si tout est propre |
