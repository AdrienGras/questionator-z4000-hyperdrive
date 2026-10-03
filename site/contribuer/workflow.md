# Workflow

Le déroulé complet du travail, de l'issue à la fusion. La source de ces règles est [`CLAUDE.md`](https://github.com/AdrienGras/questionator-z4000-hyperdrive/blob/main/CLAUDE.md#conventions-du-projet), section « Conventions du projet ».

## Une branche et une PR par ticket

Chaque ticket a sa branche (`feat/73-guide-contributeur`, `fix/…`) et sa pull request vers `main`. La description de la PR contient `Closes #n`. Une fois F01 livré, personne ne pousse directement sur `main`.

## Les tickets se suivent

La PR d'un ticket est fusionnée avant d'ouvrir la branche du suivant, qui part de `main` à jour. Chaque PR touche `docs/INDEX.md`, `docs/HANDOFF.md` et `docs/DECISIONS.md` : deux PR en parallèle entrent donc toujours en conflit.

## Ouvrir la PR en brouillon

1. Poussez la branche et ouvrez la PR **en brouillon** (`gh pr create --draft`). SonarQube Cloud n'analyse que `main` et les PR, pas une branche seule.
2. Attendez la CI : `gh pr checks <n> --watch`.
3. Lancez le contrôle SonarQube Cloud :

   ```bash
   .claude/scripts/sonar-check.sh --pr <n> --wait
   ```

   `--wait` attend que l'analyse porte sur le dernier commit. Corrigez jusqu'à « Quality gate OK », 0 issue et 0 hotspot. Le script sort avec un code non nul sinon.
4. Passez la PR en « Ready for review » (`gh pr ready <n>`).

Les commandes exactes sont dans [Pull request](https://github.com/AdrienGras/questionator-z4000-hyperdrive/blob/main/docs/CONVENTIONS.md#pull-request--checklist-avant--ready-for-review-). Le script lui-même : [`sonar-check.sh`](https://github.com/AdrienGras/questionator-z4000-hyperdrive/blob/main/.claude/scripts/sonar-check.sh). Pourquoi une branche seule n'est pas analysée : voir [QUIRKS.md](https://github.com/AdrienGras/questionator-z4000-hyperdrive/blob/main/docs/QUIRKS.md#sonarqube-cloud-nanalyse-pas-une-branche-sans-pr-2026-09-24).

## La fusion

La PR s'arrête à « Ready for review », CI et SonarQube au vert. **Le mainteneur fusionne**, sur son accord explicite. Ne fusionnez jamais de vous-même.

## Avant de passer en « Ready for review »

Mettez à jour la mémoire projet (`docs/INDEX.md`, `docs/HANDOFF.md`, et les autres fichiers concernés). La règle est décrite dans [Travailler avec Claude Code](./claude-code#regle-de-fin) et sa source est [`CLAUDE.md`](https://github.com/AdrienGras/questionator-z4000-hyperdrive/blob/main/CLAUDE.md#règle-de-fin-dimplémentation-non-négociable).
