# Conventions

Cette page résume les règles de code et de commit. Chaque règle renvoie à sa source sur GitHub, qui fait foi. Les gabarits de code (route, dialogue, mutation de session…) sont dans [CONVENTIONS.md](https://github.com/AdrienGras/questionator-z4000-hyperdrive/blob/main/docs/CONVENTIONS.md), une section par type de fichier.

## Messages de commit

Un commit s'écrit `<emoji> <message au présent, en français>`, avec un emoji Unicode et un seul. Par exemple : `✨ Ajoute le tirage aléatoire d'une question par catégorie`. Pas de `:shortcode:`. La liste des emojis courants et le gabarit complet sont dans [Message de commit](https://github.com/AdrienGras/questionator-z4000-hyperdrive/blob/main/docs/CONVENTIONS.md#message-de-commit--gitmoji).

## Fichiers et imports

- **Noms en kebab-case**, composants compris : `session-card.tsx` exporte `SessionCard`. Seules les routes TanStack gardent leur syntaxe. oxlint le vérifie.
- **Imports par `@/`** : `./` seulement pour un fichier du même dossier, `../` interdit.
- **Pas de barrel** : pas de `index.ts` qui réexporte. On importe le fichier qui déclare le symbole. `pnpm deps` le vérifie.
- **Tests à côté du code** : `x.test.ts` près de `x.ts`.

Détail : [Règles tacites de l'arborescence](https://github.com/AdrienGras/questionator-z4000-hyperdrive/blob/main/docs/CONVENTIONS.md#arborescence-et-imports--squelette) et [oxlint, règles configurées](https://github.com/AdrienGras/questionator-z4000-hyperdrive/blob/main/docs/CONVENTIONS.md#oxlint--règles-configurées).

## Formatage et lint

oxfmt formate le code (`pnpm format`) et oxlint le contrôle, avec les règles qui s'appuient sur les types ; `pnpm lint` échoue sur un simple avertissement. Les fichiers Markdown ne sont pas formatés. La configuration est dans [`.oxfmtrc.json`](https://github.com/AdrienGras/questionator-z4000-hyperdrive/blob/main/.oxfmtrc.json) et [`.oxlintrc.json`](https://github.com/AdrienGras/questionator-z4000-hyperdrive/blob/main/.oxlintrc.json). Une exception s'écrit dans le fichier de configuration, avec sa raison, plutôt que par un commentaire de désactivation.

## Commentaires

Dans le code existant, les commentaires sont en français et disent pourquoi, pas quoi. Ils citent l'arbitrage concerné quand il existe (`D72`, `#87`). Faites de même.

## Interface et langues

Toute chaîne visible passe par le dictionnaire d'interface, jamais en dur : voir [Composant d'écran traduit](https://github.com/AdrienGras/questionator-z4000-hyperdrive/blob/main/docs/CONVENTIONS.md#composant-décran-traduit--squelette).

## Pull request

La checklist avant « Ready for review » est dans [Pull request](https://github.com/AdrienGras/questionator-z4000-hyperdrive/blob/main/docs/CONVENTIONS.md#pull-request--checklist-avant--ready-for-review-). Le déroulé est décrit dans [Workflow](./workflow).
