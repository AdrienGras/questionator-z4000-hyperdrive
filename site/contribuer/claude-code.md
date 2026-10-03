# Travailler avec Claude Code

Le projet est développé avec [Claude Code](https://claude.com/claude-code), et sa mémoire est écrite pour lui. Un contributeur humain n'a pas besoin de l'utiliser, mais il doit savoir que ces fichiers existent et à quoi ils servent. Ce guide est le point d'entrée humain ; la mémoire projet reste la référence. Elle est décrite dans la section [Mémoire projet de CLAUDE.md](https://github.com/AdrienGras/questionator-z4000-hyperdrive/blob/main/CLAUDE.md#mémoire-projet).

## Les fichiers de mémoire

| Fichier | Rôle |
|---|---|
| [`CLAUDE.md`](https://github.com/AdrienGras/questionator-z4000-hyperdrive/blob/main/CLAUDE.md) | Règles qui s'appliquent toujours au projet. Claude Code le lit à chaque session. |
| [`docs/HANDOFF.md`](https://github.com/AdrienGras/questionator-z4000-hyperdrive/blob/main/docs/HANDOFF.md) | Journal de session, de la plus récente à la plus ancienne : où on en est, ce qui reste à faire. |
| [`docs/handoff/`](https://github.com/AdrienGras/questionator-z4000-hyperdrive/blob/main/docs/handoff) | Archives du journal, une par mois (`AAAA-MM.md`). |
| [`docs/INDEX.md`](https://github.com/AdrienGras/questionator-z4000-hyperdrive/blob/main/docs/INDEX.md) | Catalogue des fonctionnalités livrées, avec liens vers leur spec et leur plan. |
| [`docs/DECISIONS.md`](https://github.com/AdrienGras/questionator-z4000-hyperdrive/blob/main/docs/DECISIONS.md) | Registre des arbitrages (voir [Décisions](./decisions)). |
| [`docs/CONVENTIONS.md`](https://github.com/AdrienGras/questionator-z4000-hyperdrive/blob/main/docs/CONVENTIONS.md) | Squelettes de code et règles tacites (voir [Conventions](./conventions)). |
| [`docs/QUIRKS.md`](https://github.com/AdrienGras/questionator-z4000-hyperdrive/blob/main/docs/QUIRKS.md) | Pièges et comportements non évidents, un par section. |
| [`docs/BACKLOG.md`](https://github.com/AdrienGras/questionator-z4000-hyperdrive/blob/main/docs/BACKLOG.md) | Idées et améliorations non urgentes. |
| [`docs/ENVIRONMENT.md`](https://github.com/AdrienGras/questionator-z4000-hyperdrive/blob/main/docs/ENVIRONMENT.md) | Chemins, services, ports, variables d'environnement. |
| [`docs/superpowers/`](https://github.com/AdrienGras/questionator-z4000-hyperdrive/blob/main/docs/superpowers) | Spécifications (`specs/`) et plans d'implémentation (`plans/`) des fonctionnalités. |

Ces fichiers sont longs. Ne les lisez pas en entier : repérez la section avec `grep -n '^## ' docs/<fichier>.md`, puis lisez cette plage. Quelle information va dans quel fichier : voir [À mettre à jour durant la session](https://github.com/AdrienGras/questionator-z4000-hyperdrive/blob/main/CLAUDE.md#à-mettre-à-jour-durant-la-session-decision-tree--une-question--un-fichier), une table de décision d'une question par fichier.

## Le hook SessionStart

Au démarrage d'une session, Claude Code lance deux commandes déclarées dans [`.claude/settings.json`](https://github.com/AdrienGras/questionator-z4000-hyperdrive/blob/main/.claude/settings.json) :

1. `.claude/scripts/rotate-memory.sh` archive dans `docs/handoff/` les entrées de `HANDOFF.md` des mois révolus ;
2. [`.claude/hooks/load-memory.sh`](https://github.com/AdrienGras/questionator-z4000-hyperdrive/blob/main/.claude/hooks/load-memory.sh) injecte un résumé de la mémoire dans la session : les trois dernières entrées du journal, les titres des pièges de `QUIRKS.md`, et pour les autres fichiers de `docs/` leur contenu s'ils font moins de 4 Ko, sinon leurs titres.

Le snapshot complet est écrit dans `.git/memory-snapshot.md`. Le contexte injecté n'en est qu'un aperçu.

## /load-memory

Le hook suffit pour se resituer. La commande [`/load-memory`](https://github.com/AdrienGras/questionator-z4000-hyperdrive/blob/main/.claude/commands/load-memory.md) sert à charger davantage : sans argument, elle n'affiche que la carte des sections disponibles ; avec un argument (`full`, un nombre, un nom de fichier), elle charge ce qui est demandé.

## La règle de fin d'implémentation {#regle-de-fin}

À la fin de toute implémentation significative, avant d'annoncer que c'est terminé, il faut mettre à jour la mémoire : `INDEX.md` et `HANDOFF.md` toujours, puis `QUIRKS.md`, `BACKLOG.md`, `CONVENTIONS.md`, `ENVIRONMENT.md` ou `CLAUDE.md` quand le travail y a apporté quelque chose. Une entrée de `HANDOFF.md` porte quatre marqueurs en gras (`**Dernière chose faite**`, `**Trucs en suspens**`, `**Prochaine chose à creuser**`, `**Notes pour future Claude**`), car le hook les lit pour construire son résumé. La règle complète est dans [Règle de fin d'implémentation](https://github.com/AdrienGras/questionator-z4000-hyperdrive/blob/main/CLAUDE.md#règle-de-fin-dimplémentation-non-négociable).

Elle vaut aussi pour vous : une PR qui change le comportement du projet sans toucher la mémoire est incomplète.

## Le contrôle SonarQube

[`.claude/scripts/sonar-check.sh`](https://github.com/AdrienGras/questionator-z4000-hyperdrive/blob/main/.claude/scripts/sonar-check.sh) interroge SonarQube Cloud pour une PR ou une branche. Son usage est décrit dans [Workflow](./workflow).
